import type { Asset, Candle } from './types'

/**
 * Deterministic pseudo-random number generator (mulberry32).
 * Using a seed means the "mock market" looks the same every time you
 * reload the page instead of jumping around randomly, which makes the
 * dashboard easier to reason about while learning the code.
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

function seedFromSymbol(symbol: string): number {
  let hash = 0
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash << 5) - hash + symbol.charCodeAt(i)
    hash |= 0
  }
  return hash
}

const DAYS_OF_HISTORY = 120
/** Daily volatility as a fraction of price, tuned per-asset for realism. */
const VOLATILITY: Record<string, number> = {
  BTC: 0.022,
  ETH: 0.028,
  SOL: 0.045,
  BNB: 0.025,
}

/**
 * Generates a realistic-looking historical daily candle series for an
 * asset using a simple random walk with mild upward drift and occasional
 * trend regimes (so SMA crossovers actually happen a few times).
 */
export function generateMockCandles(asset: Asset): Candle[] {
  const rand = mulberry32(seedFromSymbol(asset.symbol))
  const volatility = VOLATILITY[asset.symbol] ?? 0.03
  const candles: Candle[] = []

  let price = asset.basePrice * 0.82
  let trend = 0
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  for (let i = 0; i < DAYS_OF_HISTORY; i++) {
    // Occasionally shift into a new trend regime (bullish/bearish/flat).
    if (i % 14 === 0) {
      trend = (rand() - 0.45) * 0.006
    }

    const noise = (rand() - 0.5) * volatility
    const change = trend + noise
    const open = price
    const close = Math.max(open * (1 + change), 0.01)
    const high = Math.max(open, close) * (1 + rand() * volatility * 0.4)
    const low = Math.min(open, close) * (1 - rand() * volatility * 0.4)

    const timestamp = now - (DAYS_OF_HISTORY - i) * dayMs

    candles.push({
      time: `Day ${i + 1}`,
      timestamp,
      open,
      high,
      low,
      close,
    })

    price = close
  }

  return candles
}
