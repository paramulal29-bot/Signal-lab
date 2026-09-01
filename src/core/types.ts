/**
 * Core domain types for the SignalLab signal-generation engine.
 * Everything here is plain data — no React, no rendering concerns.
 */

export type AssetSymbol = 'BTC' | 'ETH' | 'SOL' | 'BNB'

export interface Asset {
  symbol: AssetSymbol
  name: string
  /** Starting price used to seed the mock price history (USD). */
  basePrice: number
  color: string
}

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

export interface Signal {
  id: string
  asset: AssetSymbol
  action: SignalAction
  /** Index into the candle array this signal was generated on. */
  candleIndex: number
  timestamp: number
  entryPrice: number
  /** Take-profit target. Undefined for WAIT signals. */
  target?: number
  /** Stop-loss / invalidation level. Undefined for WAIT signals. */
  stopLoss?: number
  riskLevel: RiskLevel
  /** Confidence score from 0-100, derived from indicator separation. */
  strength: number
  reasoning: string
}

export type SignalOutcome = 'WIN' | 'LOSS' | 'OPEN'

/** A completed (or still-open) trade produced by the backtest engine. */
export interface BacktestTrade {
  id: string
  asset: AssetSymbol
  action: 'BUY' | 'SELL'
  entryTime: string
  entryPrice: number
  exitTime: string | null
  exitPrice: number | null
  returnPct: number | null
  outcome: SignalOutcome
}

export interface BacktestStats {
  totalTrades: number
  wins: number
  losses: number
  open: number
  winRatePct: number
  avgReturnPct: number
  bestTradePct: number
  worstTradePct: number
}

export interface BacktestResult {
  asset: AssetSymbol
  trades: BacktestTrade[]
  stats: BacktestStats
}

export interface AssetMarketData {
  asset: Asset
  candles: Candle[]
  currentPrice: number
  changePct24h: number
  /** Every BUY/SELL crossover found in the history, oldest first. */
  signals: Signal[]
  /** Latest computed signal for this asset (may be WAIT). */
  latestSignal: Signal
  backtest: BacktestResult
}
