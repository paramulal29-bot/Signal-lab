import { describe, expect, it } from 'vitest'
import { calculateDiscipline, detectOvertrading } from './DisciplineEngine'
import type { PaperTrade, RuleViolation } from '../types'

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
    realizedPnl: 10,
    realizedReturnPct: 10,
    feesPaid: 0.2,
    maxFavorablePrice: 110,
    maxAdversePrice: 99,
    riskPctAtEntry: 0.01,
    enteredAfterExpiry: false,
    dataMode: 'LIVE',
    ...overrides,
  }
}

describe('discipline scoring', () => {
  it('starts at a perfect score before any trades', () => {
    expect(calculateDiscipline([], []).overall).toBe(100)
  })

  it('scores a disciplined trader highly', () => {
    const trades = [trade(), trade(), trade()]
    expect(calculateDiscipline(trades, []).overall).toBeGreaterThanOrEqual(90)
  })

  it('penalizes chasing expired signals', () => {
    const disciplined = calculateDiscipline([trade(), trade()], [])
    const chaser = calculateDiscipline(
      [trade({ enteredAfterExpiry: true }), trade({ enteredAfterExpiry: true })],
      [],
    )

    expect(chaser.entryDiscipline).toBeLessThan(disciplined.entryDiscipline)
    expect(chaser.overall).toBeLessThan(disciplined.overall)
    expect(chaser.coachNote).toMatch(/expired/i)
  })

  it('penalizes oversized risk', () => {
    const score = calculateDiscipline([trade({ riskPctAtEntry: 0.05 })], [])
    expect(score.riskManagement).toBeLessThan(60)
  })

  it('does NOT reward profit — a profitable rule-breaker scores badly', () => {
    const violations: RuleViolation[] = [
      { id: 'v1', type: 'LATE_ENTRY', timestamp: 1, detail: 'late' },
      { id: 'v2', type: 'OVERSIZED_RISK', timestamp: 2, detail: 'oversized' },
    ]
    const profitableRuleBreaker = calculateDiscipline(
      [
        trade({ realizedPnl: 5_000, riskPctAtEntry: 0.08, enteredAfterExpiry: true }),
        trade({ realizedPnl: 4_000, riskPctAtEntry: 0.06, enteredAfterExpiry: true }),
      ],
      violations,
    )

    const disciplinedLoser = calculateDiscipline(
      [trade({ realizedPnl: -50, outcome: 'STOP_HIT' }), trade({ realizedPnl: -40, outcome: 'STOP_HIT' })],
      [],
    )

    expect(disciplinedLoser.overall).toBeGreaterThan(profitableRuleBreaker.overall)
  })

  it('penalizes erratic position sizing through consistency', () => {
    const steady = calculateDiscipline([trade({ riskPctAtEntry: 0.01 }), trade({ riskPctAtEntry: 0.01 })], [])
    const erratic = calculateDiscipline(
      [trade({ riskPctAtEntry: 0.002 }), trade({ riskPctAtEntry: 0.02 })],
      [],
    )

    expect(erratic.consistency).toBeLessThan(steady.consistency)
  })

  it('keeps every recorded violation visible', () => {
    const violations: RuleViolation[] = [{ id: 'v1', type: 'LATE_ENTRY', timestamp: 1, detail: 'late' }]
    expect(calculateDiscipline([trade()], violations).violations).toHaveLength(1)
  })
})

describe('overtrading detection', () => {
  it('flags more than five trades within the window', () => {
    const now = 10_000_000
    const trades = Array.from({ length: 6 }, () => trade({ openedAt: now - 1_000 }))
    expect(detectOvertrading(trades, now)).toBe(true)
  })

  it('does not flag trades spread outside the window', () => {
    const now = 10_000_000
    const trades = Array.from({ length: 6 }, (_, i) => trade({ openedAt: now - i * 3_600_001 }))
    expect(detectOvertrading(trades, now)).toBe(false)
  })
})
