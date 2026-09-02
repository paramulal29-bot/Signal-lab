import { MAX_RISK_PCT } from './rules'
import type { PaperTrade } from '../types'

export interface TradeQuality {
  /** Result in R: profit or loss as a multiple of the risk taken. */
  rMultiple: number
  /** 0-100, scored on process only. A loss can score 100. */
  decisionQuality: number
  checks: {
    riskControl: boolean
    entryDiscipline: boolean
    ruleAdherence: boolean
    levelsRespected: boolean
  }
  note: string
}

/**
 * Scores the QUALITY of a completed practice decision.
 *
 * Critically, this is not a profit score: a losing trade that respected
 * the entry window, sizing and invalidation scores full marks, and a
 * winning trade taken late at triple risk does not. Rewarding outcome
 * over process is how simulators teach people to gamble.
 */
export function evaluateTrade(trade: PaperTrade): TradeQuality {
  const riskPerUnit = Math.abs(trade.entryPrice - trade.invalidation)
  const riskAmount = riskPerUnit * trade.quantity
  const rMultiple = riskAmount > 0 ? (trade.realizedPnl ?? 0) / riskAmount : 0

  const checks = {
    riskControl: trade.riskPctAtEntry <= MAX_RISK_PCT,
    entryDiscipline: !trade.enteredAfterExpiry,
    ruleAdherence: !trade.enteredAfterExpiry && trade.riskPctAtEntry <= MAX_RISK_PCT,
    // Letting the trade reach one of its own levels, rather than being
    // cut on a feeling, is its own discipline.
    levelsRespected: trade.outcome === 'TARGET_HIT' || trade.outcome === 'STOP_HIT',
  }

  const weights = { riskControl: 30, entryDiscipline: 30, ruleAdherence: 20, levelsRespected: 20 }
  const decisionQuality = (Object.keys(weights) as (keyof typeof weights)[]).reduce(
    (score, key) => score + (checks[key] ? weights[key] : 0),
    0,
  )

  return { rMultiple, decisionQuality, checks, note: buildNote(checks, trade) }
}

function buildNote(checks: TradeQuality['checks'], trade: PaperTrade): string {
  if (!checks.entryDiscipline) {
    return 'Entered after the signal expired. Whatever the market did next, this was not the strategy’s trade.'
  }
  if (!checks.riskControl) {
    return 'Risk exceeded the training limit. Size is the one variable you fully control.'
  }
  if (!checks.levelsRespected) {
    return 'Closed manually before the target or invalidation was reached. Check whether that was a plan or a feeling.'
  }
  if (trade.outcome === 'STOP_HIT') {
    return 'Loss recorded, process intact. Your invalidation ended the trade exactly where it should have.'
  }
  return 'Entry, sizing and levels all respected. Repeat the process, not the result.'
}
