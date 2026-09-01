import type { PerformanceSummary, SignalRecord } from '../types'

/**
 * Computes aggregate performance over a set of signal records. This is a
 * summary of how the strategy performed on simulated/backtested history —
 * it describes the past, not a promise about future or live results, and
 * it never hides losing signals from the count.
 */
export function calculatePerformance(records: SignalRecord[]): PerformanceSummary {
  const closed = records.filter((r) => r.outcome !== 'OPEN' && r.returnPct !== undefined)
  const open = records.filter((r) => r.outcome === 'OPEN')
  const wins = closed.filter((r) => r.outcome === 'WIN')
  const losses = closed.filter((r) => r.outcome === 'LOSS')

  const winReturns = wins.map((r) => r.returnPct as number)
  const lossReturns = losses.map((r) => r.returnPct as number)

  const avgWinPct = winReturns.length ? average(winReturns) : 0
  const avgLossPct = lossReturns.length ? average(lossReturns) : 0

  const grossGain = sum(winReturns)
  const grossLoss = Math.abs(sum(lossReturns))
  const profitFactor = grossLoss > 0 ? grossGain / grossLoss : undefined

  return {
    totalSignals: records.length,
    closedSignals: closed.length,
    openSignals: open.length,
    wins: wins.length,
    losses: losses.length,
    winRatePct: closed.length ? (wins.length / closed.length) * 100 : 0,
    avgWinPct,
    avgLossPct,
    profitFactor,
    maxDrawdownPct: computeMaxDrawdownPct(closed),
  }
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

function average(values: number[]): number {
  return sum(values) / values.length
}

/**
 * Walks closed trades in chronological order, treating each return % as
 * additive on a running notional equity curve, and returns the largest
 * peak-to-trough decline observed. A simplification (no compounding, no
 * position sizing) appropriate for a demo performance summary.
 */
function computeMaxDrawdownPct(closed: SignalRecord[]): number {
  const chronological = [...closed].sort(
    (a, b) => (a.closedAt ?? a.timestamp) - (b.closedAt ?? b.timestamp),
  )

  let equity = 0
  let peak = 0
  let maxDrawdown = 0

  for (const record of chronological) {
    equity += record.returnPct as number
    peak = Math.max(peak, equity)
    maxDrawdown = Math.max(maxDrawdown, peak - equity)
  }

  return maxDrawdown
}
