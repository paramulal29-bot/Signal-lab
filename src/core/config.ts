import type { DataMode, Timeframe } from './types'

/**
 * Data mode for the legacy multi-asset Simulation Lab (the V1/V2
 * dashboard), which is always mock data. The live Practice Arena tracks
 * its own mode through MarketDataService instead.
 */
export const DATA_MODE: DataMode = 'SIMULATED'

export const DEFAULT_TIMEFRAME: Timeframe = '1D'
export const SUPPORTED_TIMEFRAMES: Timeframe[] = ['1H', '4H', '1D']

/* ------------------------------------------------------------------ *
 * Live market (V3) — one asset, one timeframe, deliberately
 * ------------------------------------------------------------------ */

/** Exchange symbol for the single live market this version supports. */
export const LIVE_SYMBOL = 'BTCUSDT'
export const LIVE_SYMBOL_LABEL = 'BTC/USDT'
export const LIVE_TIMEFRAME: Timeframe = '1H'

/** How often to poll the public market data endpoint. */
export const POLL_INTERVAL_MS = 20_000

/** Data older than this is STALE and must not be presented as current. */
export const STALE_AFTER_MS = 90_000

/** How long a published signal stays valid before it must not be entered. */
export const SIGNAL_VALIDITY_MS = 15 * 60_000

/** Cadence of the strategy's analysis cycle (drives the "next analysis" timer). */
export const ANALYSIS_INTERVAL_MS = 5 * 60_000
