import { MAX_RISK_PCT, OVERTRADING_LIMIT, OVERTRADING_WINDOW_MS } from '../paper/rules'
import type { DisciplineScore, PaperTrade, RuleViolation } from '../types'

/**
 * Scores how well a trainee followed the rules — deliberately NOT how
 * much virtual money they made.
 *
 * A trainee who doubles their virtual balance by risking 2% on late
 * entries and yanking stops should score badly here, and a trainee who
 * loses money while following every rule should score well. Profit is
 * measured in the performance section; this is about process.
 */

const COMPONENT_WEIGHTS = {
  riskManagement: 0.3,
  ruleAdherence: 0.3,
  entryDiscipline: 0.2,
  consistency: 0.2,
}

export function calculateDiscipline(
  trades: PaperTrade[],
  violations: RuleViolation[],
): DisciplineScore {
  const closed = trades.filter((t) => t.status === 'CLOSED')

  const riskManagement = scoreRiskManagement(trades)
  const ruleAdherence = scoreRuleAdherence(trades, violations)
  const entryDiscipline = scoreEntryDiscipline(trades, violations)
  const consistency = scoreConsistency(trades)

  const overall = Math.round(
    riskManagement * COMPONENT_WEIGHTS.riskManagement +
      ruleAdherence * COMPONENT_WEIGHTS.ruleAdherence +
      entryDiscipline * COMPONENT_WEIGHTS.entryDiscipline +
      consistency * COMPONENT_WEIGHTS.consistency,
  )

  return {
    overall,
    riskManagement,
    ruleAdherence,
    entryDiscipline,
    consistency,
    coachNote: buildCoachNote({ trades, closed, violations, entryDiscipline, riskManagement }),
    violations,
  }
}

/** Penalizes oversized risk and rewards consistent, modest sizing. */
function scoreRiskManagement(trades: PaperTrade[]): number {
  if (trades.length === 0) return 100

  const risks = trades.map((t) => t.riskPctAtEntry)
  const oversized = risks.filter((r) => r > MAX_RISK_PCT).length
  const avgRisk = risks.reduce((a, b) => a + b, 0) / risks.length

  // Sizing at or below 1% is ideal; approaching the 2% cap costs points.
  const sizingPenalty = Math.max(0, (avgRisk - 0.01) / 0.01) * 25
  const oversizedPenalty = (oversized / trades.length) * 60

  return clamp(Math.round(100 - sizingPenalty - oversizedPenalty))
}

/** Straight penalty per recorded rule violation, relative to activity. */
function scoreRuleAdherence(trades: PaperTrade[], violations: RuleViolation[]): number {
  if (trades.length === 0) return 100
  const penaltyPerViolation = 18
  return clamp(Math.round(100 - violations.length * penaltyPerViolation))
}

/** Chasing expired signals is the single most damaging habit here. */
function scoreEntryDiscipline(trades: PaperTrade[], violations: RuleViolation[]): number {
  if (trades.length === 0) return 100
  const lateEntries = trades.filter((t) => t.enteredAfterExpiry).length
  const overtrading = violations.filter((v) => v.type === 'OVERTRADING').length

  const latePenalty = (lateEntries / trades.length) * 70
  const overtradingPenalty = overtrading * 10

  return clamp(Math.round(100 - latePenalty - overtradingPenalty))
}

/** Rewards steady sizing rather than erratic swings between trades. */
function scoreConsistency(trades: PaperTrade[]): number {
  if (trades.length < 2) return 100

  const risks = trades.map((t) => t.riskPctAtEntry)
  const mean = risks.reduce((a, b) => a + b, 0) / risks.length
  if (mean === 0) return 100

  const variance = risks.reduce((a, r) => a + (r - mean) ** 2, 0) / risks.length
  const coefficientOfVariation = Math.sqrt(variance) / mean

  return clamp(Math.round(100 - coefficientOfVariation * 100))
}

function buildCoachNote(input: {
  trades: PaperTrade[]
  closed: PaperTrade[]
  violations: RuleViolation[]
  entryDiscipline: number
  riskManagement: number
}): string {
  const { trades, violations, entryDiscipline, riskManagement } = input

  if (trades.length === 0) {
    return 'No practice trades yet. Wait for a valid setup — the market does not owe you a trade.'
  }

  const lateEntries = trades.filter((t) => t.enteredAfterExpiry).length
  if (lateEntries > 0) {
    return `You entered ${lateEntries === 1 ? 'a trade' : `${lateEntries} trades`} after the signal had expired. Stop chasing the market. An expired setup is not a setup.`
  }

  const oversized = trades.filter((t) => t.riskPctAtEntry > MAX_RISK_PCT).length
  if (oversized > 0) {
    return 'You exceeded the training risk limit. Position size is the part of trading you fully control — protect your capital first.'
  }

  if (violations.some((v) => v.type === 'OVERTRADING')) {
    return 'You opened a lot of positions in a short window. Frequency is not edge. Fewer, cleaner setups.'
  }

  if (riskManagement >= 90 && entryDiscipline >= 90) {
    return 'You followed the entry and risk rules correctly. Keep the process identical whether the last trade won or lost.'
  }

  return 'Rules were mostly followed. Review your sizing and entry timing on the trades below.'
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value))
}

/** Detects overtrading from the recent trade history. */
export function detectOvertrading(trades: PaperTrade[], now = Date.now()): boolean {
  const recent = trades.filter((t) => now - t.openedAt <= OVERTRADING_WINDOW_MS)
  return recent.length > OVERTRADING_LIMIT
}
