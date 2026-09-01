import type { DataMode, Timeframe } from './types'

/**
 * Single source of truth for whether the app is running on simulated or
 * live data. Every provider wired up today is mock, so this is always
 * 'SIMULATED'. Flip it only once a real MarketDataProvider is in use —
 * the UI reads this constant (not a hardcoded string) so the
 * simulated-data warnings stay accurate everywhere automatically.
 */
export const DATA_MODE: DataMode = 'SIMULATED'

export const DEFAULT_TIMEFRAME: Timeframe = '1D'
export const SUPPORTED_TIMEFRAMES: Timeframe[] = ['1H', '4H', '1D']
