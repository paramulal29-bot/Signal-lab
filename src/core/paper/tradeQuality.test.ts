import { describe, expect, it } from 'vitest'
import { evaluateTrade } from './tradeQuality'
import type { PaperTrade } from '../types'

function trade(overrides: Partial<PaperTrade> = {}): PaperTrade {
  return {
    id: 't-1',
    signalId: 'sig-1',
    symbol: 'BTC',
    direction: 'BUY',
    status: 'CLOSED',
    quantity: 2,
    entryPrice: 100,
    entryMidPrice: 100,
    target: 110,
    invalidation: 95,
    openedAt: 1_000,
    closedAt: 2_000,
    exitPrice: 110,
    outcome: 'TARGET_HIT',
    realizedPnl: 20,
    realizedReturnPct: 10,
    feesPaid: 0.4,
    maxFavorablePrice: 110,
    maxAdversePrice: 99,
    riskPctAtEntry: 0.01,
    enteredAfterExpiry: false,
    dataMode: 'LIVE',
    ...overrides,
  }
}

describe('R multiple', () => {
  it('expresses profit as a multiple of the risk taken', () => {
    // risk/unit = |100 - 95| = 5, quantity 2 → risk $10; P/L $20 → +2R
    expect(evaluateTrade(trade()).rMultiple).toBeCloseTo(2, 6)
  })

  it('is negative on a loss', () => {
    const quality = evaluateTrade(
      trade({ realizedPnl: -10, outcome: 'STOP_HIT', exitPrice: 95 }),
    )
    expect(quality.rMultiple).toBeCloseTo(-1, 6)
  })
})

describe('decision quality is scored on process, not profit', () => {
  it('gives a disciplined LOSS full marks', () => {
    const quality = evaluateTrade(
      trade({ realizedPnl: -10, outcome: 'STOP_HIT', exitPrice: 95 }),
    )
    expect(quality.decisionQuality).toBe(100)
    expect(quality.rMultiple).toBeLessThan(0)
    expect(quality.note).toMatch(/process intact/i)
  })

  it('penalizes a PROFITABLE trade taken after expiry', () => {
    const quality = evaluateTrade(trade({ enteredAfterExpiry: true, realizedPnl: 500 }))
    expect(quality.checks.entryDiscipline).toBe(false)
    expect(quality.decisionQuality).toBeLessThan(60)
    expect(quality.note).toMatch(/expired/i)
  })

  it('ranks a disciplined loss above a rule-breaking win', () => {
    const disciplinedLoss = evaluateTrade(
      trade({ realizedPnl: -10, outcome: 'STOP_HIT' }),
    )
    const recklessWin = evaluateTrade(
      trade({ realizedPnl: 900, enteredAfterExpiry: true, riskPctAtEntry: 0.09 }),
    )
    expect(disciplinedLoss.decisionQuality).toBeGreaterThan(recklessWin.decisionQuality)
  })

  it('flags oversized risk', () => {
    const quality = evaluateTrade(trade({ riskPctAtEntry: 0.05 }))
    expect(quality.checks.riskControl).toBe(false)
    expect(quality.note).toMatch(/risk exceeded/i)
  })

  it('notes a manual close that never reached either level', () => {
    const quality = evaluateTrade(trade({ outcome: 'USER_CLOSED' }))
    expect(quality.checks.levelsRespected).toBe(false)
    expect(quality.note).toMatch(/closed manually/i)
  })
})
