import { describe, expect, it } from 'vitest'
import { calculatePaperPerformance, equityCurve } from './PaperPerformance'
import { STARTING_CAPITAL } from '../paper/rules'
import type { PaperTrade } from '../types'

function trade(overrides: Partial<PaperTrade> = {}): PaperTrade {
  return {
    id: `t-${Math.random()}`,
    signalId: 'sig-1',
    symbol: 'BTC',
    direction: 'BUY',
    status: 'CLOSED',
    quantity: 1,
    entryPrice: 100,
    entryMidPrice: 100,
    target: 110,
    invalidation: 95,
    openedAt: 1_000,
    closedAt: 2_000,
    exitPrice: 110,
    outcome: 'TARGET_HIT',
    realizedPnl: 100,
    realizedReturnPct: 1,
    feesPaid: 0.2,
    maxFavorablePrice: 110,
    maxAdversePrice: 99,
    riskPctAtEntry: 0.01,
    enteredAfterExpiry: false,
    dataMode: 'LIVE',
    ...overrides,
  }
}

describe('paper performance', () => {
  it('reports zeroes with no trades rather than inventing numbers', () => {
    const stats = calculatePaperPerformance([])
    expect(stats.totalTrades).toBe(0)
    expect(stats.winRatePct).toBe(0)
    expect(stats.currentBalance).toBe(STARTING_CAPITAL)
    expect(stats.profitFactor).toBeUndefined()
  })

  it('counts wins and losses, including negative returns', () => {
    const stats = calculatePaperPerformance([
      trade({ realizedPnl: 100 }),
      trade({ realizedPnl: -50, outcome: 'STOP_HIT' }),
      trade({ realizedPnl: -25, outcome: 'STOP_HIT' }),
    ])

    expect(stats.wins).toBe(1)
    expect(stats.losses).toBe(2)
    expect(stats.winRatePct).toBeCloseTo(33.33, 1)
    expect(stats.avgLossUsd).toBeLessThan(0)
  })

  it('reports a negative virtual return when the trainee lost money', () => {
    const stats = calculatePaperPerformance([trade({ realizedPnl: -500, outcome: 'STOP_HIT' })])
    expect(stats.virtualReturnPct).toBeLessThan(0)
    expect(stats.currentBalance).toBe(STARTING_CAPITAL - 500)
  })

  it('excludes late entries from strategy stats but keeps them in the balance', () => {
    const stats = calculatePaperPerformance([
      trade({ realizedPnl: 100 }),
      trade({ realizedPnl: 900, enteredAfterExpiry: true }),
    ])

    expect(stats.wins).toBe(1)
    expect(stats.excludedLateEntries).toBe(1)
    expect(stats.currentBalance).toBe(STARTING_CAPITAL + 1_000)
  })

  it('computes profit factor from gross gains over gross losses', () => {
    const stats = calculatePaperPerformance([
      trade({ realizedPnl: 200 }),
      trade({ realizedPnl: -100, outcome: 'STOP_HIT' }),
    ])
    expect(stats.profitFactor).toBeCloseTo(2, 6)
  })

  it('leaves open trades out of the closed-trade statistics', () => {
    const stats = calculatePaperPerformance([
      trade({ status: 'OPEN', realizedPnl: undefined, closedAt: undefined, outcome: undefined }),
    ])
    expect(stats.openTrades).toBe(1)
    expect(stats.closedTrades).toBe(0)
    expect(stats.currentBalance).toBe(STARTING_CAPITAL)
  })
})

describe('equity curve', () => {
  it('starts at the starting capital', () => {
    expect(equityCurve([])[0].equity).toBe(STARTING_CAPITAL)
  })

  it('only moves on recorded closed trades, in chronological order', () => {
    const curve = equityCurve([
      trade({ realizedPnl: -100, closedAt: 3_000, outcome: 'STOP_HIT' }),
      trade({ realizedPnl: 200, closedAt: 2_000 }),
    ])

    expect(curve.map((p) => p.equity)).toEqual([
      STARTING_CAPITAL,
      STARTING_CAPITAL + 200,
      STARTING_CAPITAL + 100,
    ])
  })

  it('reports drawdown from a losing sequence', () => {
    const stats = calculatePaperPerformance([
      trade({ realizedPnl: 500, closedAt: 2_000 }),
      trade({ realizedPnl: -1_000, closedAt: 3_000, outcome: 'STOP_HIT' }),
    ])
    expect(stats.maxDrawdownPct).toBeGreaterThan(0)
  })
})
