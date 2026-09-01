import { describe, expect, it } from 'vitest'
import { PaperTradingEngine } from './PaperTradingEngine'
import { MAX_RISK_PCT, STARTING_CAPITAL } from './rules'
import type { Candle, PublishedSignal } from '../types'

const engine = new PaperTradingEngine()

function signal(overrides: Partial<PublishedSignal> = {}): PublishedSignal {
  return {
    id: 'sig-1',
    asset: 'BTC',
    timeframe: '1H',
    action: 'BUY',
    candleIndex: 10,
    timestamp: 1_000,
    entryZone: { low: 99, high: 101 },
    target: 110,
    stopLoss: 95,
    riskLevel: 'Medium',
    strength: 70,
    strategyName: 'Test Strategy',
    reasoning: 'test',
    isSimulated: true,
    state: 'ACTIVE',
    publishedAt: 1_000,
    expiresAt: 100_000,
    dataMode: 'SIMULATED',
    dataSource: 'test',
    marketPriceAtPublish: 100,
    ...overrides,
  }
}

function candle(overrides: Partial<Candle> = {}): Candle {
  return { time: 't', timestamp: 2_000, open: 100, high: 101, low: 99, close: 100, ...overrides }
}

describe('opening a trade', () => {
  it('sizes the position from risk and stop distance', () => {
    const result = engine.openTrade(
      { signal: signal(), marketPrice: 100, riskPct: 0.01, equity: 10_000, dataMode: 'LIVE', now: 5_000 },
      false,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    // Risk $100; entry fills slightly above 100 due to costs, stop at 95.
    const riskPerUnit = result.trade.entryPrice - 95
    expect(result.trade.quantity).toBeCloseTo(100 / riskPerUnit, 6)
  })

  it('fills a BUY worse than mid — costs always run against the trainee', () => {
    const result = engine.openTrade(
      { signal: signal(), marketPrice: 100, riskPct: 0.01, equity: 10_000, dataMode: 'LIVE' },
      false,
    )
    if (!result.ok) throw new Error('expected success')
    expect(result.trade.entryPrice).toBeGreaterThan(100)
  })

  it('fills a SELL worse than mid too', () => {
    const result = engine.openTrade(
      {
        signal: signal({ action: 'SELL', target: 90, stopLoss: 105 }),
        marketPrice: 100,
        riskPct: 0.01,
        equity: 10_000,
        dataMode: 'LIVE',
      },
      false,
    )
    if (!result.ok) throw new Error('expected success')
    expect(result.trade.entryPrice).toBeLessThan(100)
  })

  it('refuses risk above the training limit', () => {
    const result = engine.openTrade(
      { signal: signal(), marketPrice: 100, riskPct: MAX_RISK_PCT + 0.001, equity: 10_000, dataMode: 'LIVE' },
      false,
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('RISK_LIMIT_EXCEEDED')
  })

  it('refuses to trade without a verified market price', () => {
    const result = engine.openTrade(
      { signal: signal(), marketPrice: Number.NaN, riskPct: 0.01, equity: 10_000, dataMode: 'LIVE' },
      false,
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('NO_MARKET_PRICE')
  })

  it('refuses a WAIT signal', () => {
    const result = engine.openTrade(
      {
        signal: signal({ action: 'WAIT', target: undefined, stopLoss: undefined }),
        marketPrice: 100,
        riskPct: 0.01,
        equity: 10_000,
        dataMode: 'LIVE',
      },
      false,
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('NO_ACTIONABLE_SIGNAL')
  })

  it('allows only one open position at a time', () => {
    const result = engine.openTrade(
      { signal: signal(), marketPrice: 100, riskPct: 0.01, equity: 10_000, dataMode: 'LIVE' },
      true,
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('POSITION_ALREADY_OPEN')
  })

  it('flags an entry made after the signal expired', () => {
    const result = engine.openTrade(
      {
        signal: signal({ expiresAt: 1_000 }),
        marketPrice: 100,
        riskPct: 0.01,
        equity: 10_000,
        dataMode: 'LIVE',
        now: 50_000,
      },
      false,
    )
    if (!result.ok) throw new Error('expected success')
    expect(result.trade.enteredAfterExpiry).toBe(true)
  })
})

describe('resolving against candles', () => {
  function openTrade() {
    const result = engine.openTrade(
      { signal: signal(), marketPrice: 100, riskPct: 0.01, equity: 10_000, dataMode: 'LIVE', now: 1_500 },
      false,
    )
    if (!result.ok) throw new Error('expected success')
    return result.trade
  }

  it('closes at target when only the target is touched', () => {
    const closed = engine.resolveAgainstCandles(openTrade(), [candle({ high: 111, low: 99 })])
    expect(closed.outcome).toBe('TARGET_HIT')
    expect(closed.exitPrice).toBe(110)
    expect(closed.realizedPnl).toBeGreaterThan(0)
  })

  it('closes at the stop when only the stop is touched', () => {
    const closed = engine.resolveAgainstCandles(openTrade(), [candle({ high: 101, low: 94 })])
    expect(closed.outcome).toBe('STOP_HIT')
    expect(closed.exitPrice).toBe(95)
    expect(closed.realizedPnl).toBeLessThan(0)
  })

  it('resolves a candle touching BOTH levels as the stop (conservative rule)', () => {
    const closed = engine.resolveAgainstCandles(openTrade(), [candle({ high: 115, low: 90 })])
    expect(closed.outcome).toBe('STOP_HIT')
    expect(closed.realizedPnl).toBeLessThan(0)
  })

  it('ignores candles that closed before the trade was opened', () => {
    const trade = openTrade()
    const stillOpen = engine.resolveAgainstCandles(trade, [
      candle({ timestamp: 1_000, high: 115, low: 90 }),
    ])
    expect(stillOpen.status).toBe('OPEN')
  })

  it('mirrors the both-touched rule for SELL trades', () => {
    const result = engine.openTrade(
      {
        signal: signal({ action: 'SELL', target: 90, stopLoss: 105 }),
        marketPrice: 100,
        riskPct: 0.01,
        equity: 10_000,
        dataMode: 'LIVE',
        now: 1_500,
      },
      false,
    )
    if (!result.ok) throw new Error('expected success')

    const closed = engine.resolveAgainstCandles(result.trade, [candle({ high: 110, low: 85 })])
    expect(closed.outcome).toBe('STOP_HIT')
    expect(closed.realizedPnl).toBeLessThan(0)
  })
})

describe('closing and accounting', () => {
  function openTrade() {
    const result = engine.openTrade(
      { signal: signal(), marketPrice: 100, riskPct: 0.01, equity: 10_000, dataMode: 'LIVE', now: 1_500 },
      false,
    )
    if (!result.ok) throw new Error('expected success')
    return result.trade
  }

  it('charges fees on both sides of a user close', () => {
    const trade = openTrade()
    const closed = engine.closeAtMarket(trade, 105, 9_000)
    expect(closed.outcome).toBe('USER_CLOSED')
    expect(closed.feesPaid).toBeGreaterThan(trade.feesPaid)
  })

  it('tracks favorable and adverse excursions', () => {
    let trade = openTrade()
    trade = engine.trackPrice(trade, 108)
    trade = engine.trackPrice(trade, 92)
    const { mfePct, maePct } = engine.excursions(trade)
    expect(mfePct).toBeGreaterThan(0)
    expect(maePct).toBeLessThan(0)
  })

  it('derives balance from recorded realized P/L only', () => {
    const trade = engine.closeAtMarket(openTrade(), 105, 9_000)
    const balance = engine.balanceFrom([trade])
    expect(balance).toBeCloseTo(STARTING_CAPITAL + (trade.realizedPnl ?? 0), 6)
  })

  it('leaves an open trade out of the balance until it closes', () => {
    expect(engine.balanceFrom([openTrade()])).toBe(STARTING_CAPITAL)
  })
})
