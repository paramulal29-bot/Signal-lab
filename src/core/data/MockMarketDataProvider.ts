import type { Asset, Candle, Timeframe } from '../types'
import type { MarketDataProvider } from './MarketDataProvider'

/**
 * Deterministic pseudo-random number generator (mulberry32). Using a
 * seed means the "mock market" looks the same every reload instead of
 * jumping around randomly, which makes the dashboard easier to reason
 * about while learning the code.
 */
function mulberry32(seed: number) {
  let a = seed
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFromString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return hash
}

/** Daily volatility as a fraction of price, tuned per-asset for realism. */
const VOLATILITY: Record<string, number> = {
  BTC: 0.022,
  ETH: 0.028,
  SOL: 0.045,
  BNB: 0.025,
}

interface TimeframeShape {
  candleCount: number
  intervalMs: number
  label: (index: number) => string
}

const TIMEFRAME_SHAPE: Record<Timeframe, TimeframeShape> = {
  '1H': { candleCount: 168, intervalMs: 60 * 60 * 1000, label: (i) => `H${i + 1}` },
  '4H': { candleCount: 180, intervalMs: 4 * 60 * 60 * 1000, label: (i) => `4H #${i + 1}` },
  '1D': { candleCount: 120, intervalMs: 24 * 60 * 60 * 1000, label: (i) => `Day ${i + 1}` },
}

function generateCandles(asset: Asset, timeframe: Timeframe): Candle[] {
  const shape = TIMEFRAME_SHAPE[timeframe]
  const rand = mulberry32(seedFromString(`${asset.symbol}:${timeframe}`))
  const volatility = VOLATILITY[asset.symbol] ?? 0.03
  const candles: Candle[] = []

  let price = asset.basePrice * 0.82
  let trend = 0
  const now = Date.now()

  for (let i = 0; i < shape.candleCount; i++) {
    // Occasionally shift into a new trend regime (bullish/bearish/flat),
    // roughly every ~12% of the series — so crossovers actually happen.
    if (i % Math.max(Math.round(shape.candleCount * 0.12), 1) === 0) {
      trend = (rand() - 0.45) * 0.006
    }

    const noise = (rand() - 0.5) * volatility
    const change = trend + noise
    const open = price
    const close = Math.max(open * (1 + change), 0.01)
    const high = Math.max(open, close) * (1 + rand() * volatility * 0.4)
    const low = Math.min(open, close) * (1 - rand() * volatility * 0.4)

    candles.push({
      time: shape.label(i),
      timestamp: now - (shape.candleCount - i) * shape.intervalMs,
      open,
      high,
      low,
      close,
    })

    price = close
  }

  return candles
}

/**
 * Mock implementation of MarketDataProvider. Generates a realistic-looking
 * historical candle series entirely in-memory — no network calls. This is
 * the only provider SignalLab has today; a live provider implements the
 * same interface and can replace this one without any other file changing.
 */
export class MockMarketDataProvider implements MarketDataProvider {
  readonly name = 'Mock Market Data Provider'
  readonly isSimulated = true

  async getCandles(asset: Asset, timeframe: Timeframe): Promise<Candle[]> {
    // A small delay so the app's loading state is exercised honestly,
    // roughly standing in for what a real network fetch would feel like.
    await new Promise((resolve) => setTimeout(resolve, 120))
    return generateCandles(asset, timeframe)
  }
}
