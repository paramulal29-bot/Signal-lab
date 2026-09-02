import { describe, expect, it } from 'vitest'
import { derivePhase, deriveNextMove, EXPIRING_THRESHOLD_MS } from './lifecycle'
import type { MarketSnapshot, PaperTrade, PublishedSignal } from '../types'

const NOW = 1_000_000

function snapshot(overrides: Partial<MarketSnapshot> = {}): MarketSnapshot {
  return {
    status: 'LIVE',
    dataMode: 'LIVE',
    dataSource: 'test',
    symbol: 'BTCUSDT',
    timeframe: '1H',
    candles: [],
    price: 100,
    lastUpdate: NOW,
    error: undefined,
    ...overrides,
  }
}

function signal(overrides: Partial<PublishedSignal> = {}): PublishedSignal {
  return {
    id: 'sig-1',
    asset: 'BTC',
    timeframe: '1H',
    action: 'BUY',
    candleIndex: 1,
    timestamp: NOW,
    entryZone: { low: 99, high: 101 },
    target: 110,
    stopLoss: 95,
    riskLevel: 'Medium',
    strength: 70,
    strategyName: 'test',
    reasoning: 'test',
    isSimulated: false,
    state: 'ACTIVE',
    publishedAt: NOW - 60_000,
    expiresAt: NOW + 300_000,
    dataMode: 'LIVE',
    dataSource: 'test',
    marketPriceAtPublish: 100,
    ...overrides,
  }
}

function trade(overrides: Partial<PaperTrade> = {}): PaperTrade {
  return {
    id: 't-1',
    signalId: 'sig-1',
    symbol: 'BTC',
    direction: 'BUY',
    status: 'OPEN',
    quantity: 1,
    entryPrice: 100,
    entryMidPrice: 100,
    target: 110,
    invalidation: 95,
    openedAt: NOW,
    feesPaid: 0.1,
    maxFavorablePrice: 100,
    maxAdversePrice: 100,
    riskPctAtEntry: 0.01,
    enteredAfterExpiry: false,
    dataMode: 'LIVE',
    ...overrides,
  }
}

const base = { openTrade: undefined, lastClosedTrade: undefined, now: NOW }

describe('signal phase', () => {
  it('is OFFLINE when the feed is down, regardless of any old signal', () => {
    expect(
      derivePhase({ ...base, snapshot: snapshot({ status: 'OFFLINE' }), signal: signal() }),
    ).toBe('OFFLINE')
  })

  it('is SCANNING when there is no signal — a legitimate state, not an error', () => {
    expect(derivePhase({ ...base, snapshot: snapshot(), signal: undefined })).toBe('SCANNING')
  })

  it('is DETECTED immediately after publication', () => {
    expect(
      derivePhase({ ...base, snapshot: snapshot(), signal: signal({ publishedAt: NOW - 1_000 }) }),
    ).toBe('DETECTED')
  })

  it('is ACTIVE once the detection moment has passed', () => {
    expect(derivePhase({ ...base, snapshot: snapshot(), signal: signal() })).toBe('ACTIVE')
  })

  it('is EXPIRING inside the final minute', () => {
    expect(
      derivePhase({
        ...base,
        snapshot: snapshot(),
        signal: signal({ expiresAt: NOW + EXPIRING_THRESHOLD_MS - 1_000 }),
      }),
    ).toBe('EXPIRING')
  })

  it('is EXPIRED once the window closes', () => {
    expect(
      derivePhase({ ...base, snapshot: snapshot(), signal: signal({ expiresAt: NOW - 1 }) }),
    ).toBe('EXPIRED')
  })

  it('is IN_TRADE while a position is open', () => {
    expect(
      derivePhase({ ...base, snapshot: snapshot(), signal: signal(), openTrade: trade() }),
    ).toBe('IN_TRADE')
  })

  it('is RESULT just after a trade closes', () => {
    expect(
      derivePhase({
        ...base,
        snapshot: snapshot(),
        signal: signal({ expiresAt: NOW - 1 }),
        lastClosedTrade: trade({ status: 'CLOSED', closedAt: NOW - 10_000 }),
      }),
    ).toBe('RESULT')
  })

  it('never invents a signal phase without a signal', () => {
    const phase = derivePhase({ ...base, snapshot: snapshot(), signal: undefined })
    expect(['SCANNING', 'OFFLINE']).toContain(phase)
  })
})

describe('next move', () => {
  it('points at the setup while one is live', () => {
    expect(deriveNextMove({ phase: 'ACTIVE', academyIncomplete: false }).key).toBe('REVIEW_SIGNAL')
  })

  it('points at the position while one is open', () => {
    expect(deriveNextMove({ phase: 'IN_TRADE', academyIncomplete: false }).key).toBe('MANAGE_POSITION')
  })

  it('points at the review after a trade closes', () => {
    expect(deriveNextMove({ phase: 'RESULT', academyIncomplete: false }).key).toBe('REVIEW_DECISION')
  })

  it('suggests learning while scanning, if there are lessons left', () => {
    expect(deriveNextMove({ phase: 'SCANNING', academyIncomplete: true }).key).toBe('CONTINUE_LEARNING')
  })

  it('says wait — not trade — when scanning with nothing left to learn', () => {
    const move = deriveNextMove({ phase: 'SCANNING', academyIncomplete: false })
    expect(move.key).toBe('WAIT_FOR_SETUP')
    expect(move.detail).toMatch(/waiting is also a decision/i)
  })
})
