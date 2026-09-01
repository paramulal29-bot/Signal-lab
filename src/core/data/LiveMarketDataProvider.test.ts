import { describe, expect, it } from 'vitest'
import { MarketDataError, parseKlines, parseTickerPrice } from './LiveMarketDataProvider'

/** A recorded-shape Binance klines payload (positional arrays of strings). */
const SAMPLE_KLINES = [
  [1700000000000, '37000.10', '37250.00', '36900.55', '37180.20', '145.32', 1700003599999, '0', 0, '0', '0', '0'],
  [1700003600000, '37180.20', '37400.00', '37100.00', '37350.75', '203.11', 1700007199999, '0', 0, '0', '0', '0'],
]

describe('parseKlines', () => {
  it('maps a Binance payload into candles', () => {
    const candles = parseKlines(SAMPLE_KLINES, '1H')

    expect(candles).toHaveLength(2)
    expect(candles[0]).toMatchObject({
      timestamp: 1700000000000,
      open: 37000.1,
      high: 37250,
      low: 36900.55,
      close: 37180.2,
      volume: 145.32,
    })
  })

  it('labels 1H candles with a UTC time', () => {
    expect(parseKlines(SAMPLE_KLINES, '1H')[0].time).toMatch(/^\d{2}:\d{2}$/)
  })

  it('labels 1D candles with a date', () => {
    expect(parseKlines(SAMPLE_KLINES, '1D')[0].time).toMatch(/[A-Z][a-z]{2} \d+/)
  })

  it('rejects a non-array payload', () => {
    expect(() => parseKlines({ code: -1121, msg: 'Invalid symbol.' }, '1H')).toThrow(MarketDataError)
  })

  it('rejects malformed entries rather than inventing prices', () => {
    expect(() => parseKlines([[1, 'a']], '1H')).toThrow(MarketDataError)
  })

  it('rejects non-numeric prices', () => {
    const bad = [[1700000000000, 'abc', '1', '1', '1', '1', 1700003599999]]
    expect(() => parseKlines(bad, '1H')).toThrow(MarketDataError)
  })

  it('rejects an empty series', () => {
    expect(() => parseKlines([], '1H')).toThrow(MarketDataError)
  })
})

describe('parseTickerPrice', () => {
  it('reads the price field', () => {
    expect(parseTickerPrice({ symbol: 'BTCUSDT', price: '37180.20' })).toBe(37180.2)
  })

  it('throws when the price is missing', () => {
    expect(() => parseTickerPrice({ symbol: 'BTCUSDT' })).toThrow(MarketDataError)
  })

  it('throws on a non-numeric price rather than returning NaN', () => {
    expect(() => parseTickerPrice({ price: 'not-a-number' })).toThrow(MarketDataError)
  })
})
