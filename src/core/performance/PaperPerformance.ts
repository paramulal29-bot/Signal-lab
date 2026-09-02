import { STARTING_CAPITAL } from '../paper/rules'
import type { PaperTrade } from '../types'

export interface PaperPerformanceSummary {
  totalTrades: number
  closedTrades: number
  openTrades: number
  wins: number
  losses: number
  expired: number
  winRatePct: number
  avgWinUsd: number
  avgLossUsd: number
  profitFactor: number | undefined
  maxDrawdownPct: number
  virtualReturnPct: number
  currentBalance: number
  avgDurationMs: number
  /** Trades excluded from strategy stats because they broke the rules. */
  excludedLateEntries: number
}

export interface EquityPoint {
  index: number
  timestamp: number
  equity: number
}

/**
 * Performance of LIVE PAPER TRADING — kept entirely separate from the
 * historical backtest numbers in PerformanceCalculator. Combining the
 * two would flatter whichever one is doing better, so they never mix.
 *
 * Trades entered after a signal expired are counted in the balance (the
 * trainee really "lost" that virtual money) but excluded from the
 * strategy's win/loss statistics, because the strategy did not tell
 * anyone to take them.
 */
export function calculatePaperPerformance(trades: PaperTrade[]): PaperPerformanceSummary {
  const closed = trades.filter((t) => t.status === 'CLOSED')
  const open = trades.filter((t) => t.status === 'OPEN')

  const strategyTrades = closed.filter((t) => !t.enteredAfterExpiry)
  const wins = strategyTrades.filter((t) => (t.realizedPnl ?? 0) > 0)
  const losses = strategyTrades.filter((t) => (t.realizedPnl ?? 0) <= 0)
  const expired = closed.filter((t) => t.outcome === 'EXPIRED_FLAT')

  const winPnls = wins.map((t) => t.realizedPnl ?? 0)
  const lossPnls = losses.map((t) => t.realizedPnl ?? 0)

  const grossGain = winPnls.reduce((a, b) => a + b, 0)
  const grossLoss = Math.abs(lossPnls.reduce((a, b) => a + b, 0))

  const currentBalance = trades.reduce((b, t) => b + (t.realizedPnl ?? 0), STARTING_CAPITAL)
  const durations = closed
    .filter((t) => t.closedAt !== undefined)
    .map((t) => (t.closedAt as number) - t.openedAt)

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    openTrades: open.length,
    wins: wins.length,
    losses: losses.length,
    expired: expired.length,
    winRatePct: strategyTrades.length ? (wins.length / strategyTrades.length) * 100 : 0,
    avgWinUsd: winPnls.length ? grossGain / winPnls.length : 0,
    avgLossUsd: lossPnls.length ? lossPnls.reduce((a, b) => a + b, 0) / lossPnls.length : 0,
    profitFactor: grossLoss > 0 ? grossGain / grossLoss : undefined,
    maxDrawdownPct: maxDrawdownPct(equityCurve(trades)),
    virtualReturnPct: ((currentBalance - STARTING_CAPITAL) / STARTING_CAPITAL) * 100,
    currentBalance,
    avgDurationMs: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
    excludedLateEntries: closed.filter((t) => t.enteredAfterExpiry).length,
  }
}

/**
 * Equity curve built from actually-recorded closed trades. It always
 * starts at the starting capital and only moves on real recorded
 * outcomes — no smoothing, no projection, no fabricated points.
 */
export function equityCurve(trades: PaperTrade[]): EquityPoint[] {
  const closed = trades
    .filter((t) => t.status === 'CLOSED' && t.closedAt !== undefined)
    .sort((a, b) => (a.closedAt as number) - (b.closedAt as number))

  const points: EquityPoint[] = [
    { index: 0, timestamp: closed[0]?.openedAt ?? Date.now(), equity: STARTING_CAPITAL },
  ]

  let equity = STARTING_CAPITAL
  closed.forEach((trade, i) => {
    equity += trade.realizedPnl ?? 0
    points.push({ index: i + 1, timestamp: trade.closedAt as number, equity })
  })

  return points
}

function maxDrawdownPct(points: EquityPoint[]): number {
  let peak = points[0]?.equity ?? STARTING_CAPITAL
  let maxDrawdown = 0

  for (const point of points) {
    peak = Math.max(peak, point.equity)
    if (peak > 0) {
      maxDrawdown = Math.max(maxDrawdown, ((peak - point.equity) / peak) * 100)
    }
  }

  return maxDrawdown
}
