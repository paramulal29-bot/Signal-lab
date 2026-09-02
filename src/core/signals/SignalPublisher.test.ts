import { beforeEach, describe, expect, it } from 'vitest'
import { resolveAgainstCandles, SignalPublisher } from './SignalPublisher'
import type { Candle, PublishedSignal, Signal } from '../types'

function baseSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: 'sig-1',
    asset: 'BTC',
    timeframe: '1H',
    action: 'BUY',
    candleIndex: 5,
    timestamp: 1_000,
    entryZone: { low: 99, high: 101 },
    target: 110,
    stopLoss: 95,
    riskLevel: 'Medium',
    strength: 70,
    strategyName: 'Test Strategy',
    reasoning: 'test',
    isSimulated: true,
    ...overrides,
  }
}

const context = { dataMode: 'LIVE' as const, dataSource: 'test', marketPrice: 100 }

describe('signal immutability', () => {
  let publisher: SignalPublisher

  beforeEach(() => {
    localStorage.clear()
    publisher = new SignalPublisher()
  })

  it('locks the record on first publication', () => {
    const first = publisher.publish(baseSignal(), { ...context, now: 1_000 })
    expect(first.state).toBe('ACTIVE')
    expect(first.marketPriceAtPublish).toBe(100)
    expect(first.expiresAt).toBeGreaterThan(first.publishedAt)
  })

  it('ignores a republish of the same id — the first version stands', () => {
    publisher.publish(baseSignal(), { ...context, now: 1_000 })
    const second = publisher.publish(
      baseSignal({ target: 999, stopLoss: 1, entryZone: { low: 1, high: 2 } }),
      { ...context, marketPrice: 500, now: 50_000 },
    )

    expect(second.target).toBe(110)
    expect(second.stopLoss).toBe(95)
    expect(second.entryZone).toEqual({ low: 99, high: 101 })
    expect(second.marketPriceAtPublish).toBe(100)
    expect(publisher.list()).toHaveLength(1)
  })

  it('freezes the published record against direct mutation', () => {
    const record = publisher.publish(baseSignal(), context)
    expect(() => {
      ;(record as { target?: number }).target = 500
    }).toThrow()
  })

  it('advances state without touching locked price levels', () => {
    const published = publisher.publish(baseSignal(), context)
    const advanced = publisher.advanceState(published.id, 'TARGET_HIT', {
      resolvedAt: 9_000,
      resolvedPrice: 110,
    })

    expect(advanced?.state).toBe('TARGET_HIT')
    expect(advanced?.target).toBe(110)
    expect(advanced?.entryZone).toEqual(published.entryZone)
    expect(advanced?.publishedAt).toBe(published.publishedAt)
  })

  it('does not move a signal out of a terminal state', () => {
    const published = publisher.publish(baseSignal(), context)
    publisher.advanceState(published.id, 'STOP_HIT', { resolvedAt: 5_000, resolvedPrice: 95 })
    const again = publisher.advanceState(published.id, 'TARGET_HIT')

    expect(again?.state).toBe('STOP_HIT')
  })

  it('expires signals whose window has closed', () => {
    const published = publisher.publish(baseSignal(), { ...context, now: 1_000 })
    const expired = publisher.expireStale(published.expiresAt + 1)

    expect(expired).toHaveLength(1)
    expect(publisher.get(published.id)?.state).toBe('EXPIRED')
    expect(publisher.activeSignal(published.expiresAt + 1)).toBeUndefined()
  })

  it('keeps losing signals in the record — there is no delete path', () => {
    const published = publisher.publish(baseSignal(), context)
    publisher.advanceState(published.id, 'STOP_HIT', { resolvedAt: 5_000, resolvedPrice: 95 })

    expect(publisher.list()).toHaveLength(1)
    expect(publisher.list()[0].state).toBe('STOP_HIT')
    expect('delete' in publisher).toBe(false)
  })

  it('persists across instances', () => {
    publisher.publish(baseSignal(), context)
    expect(new SignalPublisher().list()).toHaveLength(1)
  })
})

describe('resolveAgainstCandles', () => {
  const published: PublishedSignal = {
    ...baseSignal(),
    state: 'ACTIVE',
    publishedAt: 1_000,
    expiresAt: 100_000,
    dataMode: 'LIVE',
    dataSource: 'test',
    marketPriceAtPublish: 100,
  }

  const candle = (overrides: Partial<Candle>): Candle => ({
    time: 't',
    timestamp: 2_000,
    open: 100,
    high: 101,
    low: 99,
    close: 100,
    ...overrides,
  })

  it('reports the stop when both levels are touched in one candle', () => {
    const result = resolveAgainstCandles(published, [candle({ high: 120, low: 90 })])
    expect(result?.state).toBe('STOP_HIT')
  })

  it('reports the target when only the target is touched', () => {
    expect(resolveAgainstCandles(published, [candle({ high: 115 })])?.state).toBe('TARGET_HIT')
  })

  it('returns null while the market has not resolved it', () => {
    expect(resolveAgainstCandles(published, [candle({})])).toBeNull()
  })

  it('ignores candles from before publication', () => {
    expect(resolveAgainstCandles(published, [candle({ timestamp: 500, high: 120, low: 90 })])).toBeNull()
  })
})
