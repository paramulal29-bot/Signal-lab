/**
 * Core domain types for the SignalLab signal-generation engine.
 * Everything here is plain data — no React, no data-source, and no UI
 * concerns. This is the contract every layer (data provider, strategy,
 * signal engine, store, performance calculator, and UI) is written against.
 */

export type AssetSymbol = 'BTC' | 'ETH' | 'SOL' | 'BNB'

export interface Asset {
  symbol: AssetSymbol
  name: string
  /** Starting price used to seed the mock price history (USD). */
  basePrice: number
  color: string
}

/** Candle interval. Only '1D' is produced today; the type exists so a
 * future live provider and multi-timeframe strategies have somewhere to go. */
export type Timeframe = '1H' | '4H' | '1D'

/** Whether the app is currently running on simulated or live market data. */
export type DataMode = 'SIMULATED' | 'LIVE'

/** One OHLC price bar. `time` is a simple day index label, e.g. "Day 1". */
export interface Candle {
  time: string
  timestamp: number
  open: number
  high: number
  low: number
  close: number
}

export type SignalAction = 'BUY' | 'SELL' | 'WAIT'

export type RiskLevel = 'Low' | 'Medium' | 'High'

/** A realistic price range a trade would be entered in, rather than one exact tick. */
export interface EntryZone {
  low: number
  high: number
}

/**
 * The core unit the signal engine produces. Deliberately provider- and
 * UI-agnostic: nothing in here assumes mock data or React, so it stays
 * valid once a live MarketDataProvider replaces the mock one.
 */
export interface Signal {
  id: string
  asset: AssetSymbol
  timeframe: Timeframe
  action: SignalAction
  /** Index into the candle array this signal was generated on. */
  candleIndex: number
  timestamp: number
  entryZone: EntryZone
  /** Take-profit target. Undefined for WAIT signals. */
  target?: number
  /** Stop-loss / invalidation level. Undefined for WAIT signals. */
  stopLoss?: number
  riskLevel: RiskLevel
  /**
   * 0-100 score describing how clear the strategy's setup is right now
   * (how far apart its indicators are, scaled by volatility). This is a
   * measure of setup clarity, NOT a win probability, and it is never a
   * guarantee of any outcome.
   */
  strength: number
  strategyName: string
  reasoning: string
  /** True while every signal in the app is generated from mock/historical data. */
  isSimulated: boolean
}

export type SignalOutcome = 'OPEN' | 'WIN' | 'LOSS'

/**
 * A Signal once it has been written to a SignalStore, with its
 * resolution if one has happened yet. Both WIN and LOSS outcomes are
 * recorded — the store never filters losing signals out of history.
 */
export interface SignalRecord extends Signal {
  outcome: SignalOutcome
  exitPrice?: number
  returnPct?: number
  closedAt?: number
}

/**
 * Aggregate performance over a set of resolved SignalRecords. This is a
 * summary of how the strategy performed on simulated/backtested history —
 * never a promise about future or live performance.
 */
export interface PerformanceSummary {
  totalSignals: number
  closedSignals: number
  openSignals: number
  wins: number
  losses: number
  winRatePct: number
  avgWinPct: number
  avgLossPct: number
  /** Gross gains / gross losses. Undefined (displayed as "—") when there are no losses to divide by. */
  profitFactor: number | undefined
  maxDrawdownPct: number
}

export interface AssetMarketData {
  asset: Asset
  timeframe: Timeframe
  candles: Candle[]
  currentPrice: number
  changePct24h: number
  /** Every discrete BUY/SELL crossover event found in the history (chart markers). */
  signals: Signal[]
  /** The strategy's read on the current, most-recent state — may be WAIT. */
  currentSignal: Signal
  /** This asset's signals as recorded in the SignalStore, including resolution. */
  records: SignalRecord[]
}
