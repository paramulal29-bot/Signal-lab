import type { Candle, Timeframe } from '../types'

/**
 * Live market data from Binance's PUBLIC REST endpoints.
 *
 * Public market data only — no API key, no account, no wallet, no
 * exchange authentication, and no order placement of any kind. This
 * provider can only READ public prices.
 */

const BASE_URL = 'https://api.binance.com'

export const LIVE_DATA_SOURCE = 'Binance public REST'

/** Maps our Timeframe values onto Binance kline intervals. */
const INTERVAL: Record<Timeframe, string> = {
  '1H': '1h',
  '4H': '4h',
  '1D': '1d',
}

/** How many candles of history to request. */
const CANDLE_LIMIT = 200

export class MarketDataError extends Error {
  readonly cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'MarketDataError'
    this.cause = cause
  }
}

/**
 * A Binance kline is a positional array:
 * [openTime, open, high, low, close, volume, closeTime, ...]
 */
type BinanceKline = [number, string, string, string, string, string, number, ...unknown[]]

function isBinanceKline(value: unknown): value is BinanceKline {
  return (
    Array.isArray(value) &&
    value.length >= 7 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'string' &&
    typeof value[2] === 'string' &&
    typeof value[3] === 'string' &&
    typeof value[4] === 'string' &&
    typeof value[5] === 'string'
  )
}

function labelForTimestamp(timestamp: number, timeframe: Timeframe): string {
  const date = new Date(timestamp)
  if (timeframe === '1D') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  }
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })
}

/**
 * Parses a raw Binance klines payload into our Candle shape. Exported
 * separately from the network call so it can be unit-tested against
 * recorded payloads without touching the network.
 */
export function parseKlines(payload: unknown, timeframe: Timeframe): Candle[] {
  if (!Array.isArray(payload)) {
    throw new MarketDataError('Unexpected market data response: expected an array of klines.')
  }

  const candles: Candle[] = []
  for (const raw of payload) {
    if (!isBinanceKline(raw)) {
      throw new MarketDataError('Unexpected market data response: malformed kline entry.')
    }

    const [openTime, open, high, low, close, volume] = raw
    const candle: Candle = {
      time: labelForTimestamp(openTime, timeframe),
      timestamp: openTime,
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume),
    }

    if (
      !Number.isFinite(candle.open) ||
      !Number.isFinite(candle.high) ||
      !Number.isFinite(candle.low) ||
      !Number.isFinite(candle.close)
    ) {
      throw new MarketDataError('Unexpected market data response: non-numeric price in kline.')
    }

    candles.push(candle)
  }

  if (candles.length === 0) {
    throw new MarketDataError('Market data response contained no candles.')
  }

  return candles
}

/** Parses Binance's /ticker/price payload into a number. */
export function parseTickerPrice(payload: unknown): number {
  const price =
    typeof payload === 'object' && payload !== null && 'price' in payload
      ? Number((payload as { price: unknown }).price)
      : Number.NaN

  if (!Number.isFinite(price)) {
    throw new MarketDataError('Unexpected ticker response: missing or non-numeric price.')
  }
  return price
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new MarketDataError('Could not reach the market data service.', error)
  }

  if (!response.ok) {
    throw new MarketDataError(
      `Market data service responded with HTTP ${response.status}.`,
      response.status,
    )
  }

  try {
    return await response.json()
  } catch (error) {
    throw new MarketDataError('Market data service returned an unreadable response.', error)
  }
}

/**
 * Reads public candles and the latest trade price for one symbol.
 * `symbol` is an exchange symbol such as "BTCUSDT".
 */
export class LiveMarketDataProvider {
  readonly name = LIVE_DATA_SOURCE
  readonly isSimulated = false

  async getCandles(symbol: string, timeframe: Timeframe, signal?: AbortSignal): Promise<Candle[]> {
    const url = `${BASE_URL}/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${INTERVAL[timeframe]}&limit=${CANDLE_LIMIT}`
    return parseKlines(await fetchJson(url, signal), timeframe)
  }

  async getPrice(symbol: string, signal?: AbortSignal): Promise<number> {
    const url = `${BASE_URL}/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`
    return parseTickerPrice(await fetchJson(url, signal))
  }
}
