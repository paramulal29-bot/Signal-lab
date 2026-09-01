import type { Asset, Candle, Timeframe } from '../types'

/**
 * Contract every market-data source implements: given an asset and a
 * timeframe, resolve to a candle history. The SignalEngine, strategies,
 * and UI are all written against this interface — never against a
 * concrete data source — so a live provider (an exchange or market-data
 * API) can be dropped in later without changing anything downstream.
 */
export interface MarketDataProvider {
  /** Human-readable name, useful for logging/diagnostics. */
  readonly name: string
  /** Whether this provider's candles are simulated or a real live feed. */
  readonly isSimulated: boolean
  getCandles(asset: Asset, timeframe: Timeframe): Promise<Candle[]>
}
