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

/** One OHLC(V) price bar. `time` is a display label, e.g. "Day 1" or "14:00". */
export interface Candle {
  time: string
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  /** Base-asset volume for the bar. Absent from older simulated series. */
  volume?: number
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
  /** Whether this signal was computed from LIVE or SIMULATED candles. */
  dataMode?: DataMode
  /** Which provider supplied the candles (e.g. "Binance public REST"). */
  dataSource?: string
  /** UTC ms after which the setup is no longer valid and must not be entered. */
  expiresAt?: number
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

/* ------------------------------------------------------------------ *
 * V3: live market data
 * ------------------------------------------------------------------ */

/**
 * Connection/freshness state of the market feed. The UI must never
 * present anything other than LIVE as if it were current live data.
 */
export type MarketStatus =
  | 'CONNECTING'
  | 'LIVE'
  /** Reachable, but a recent fetch failed — showing last good data, retrying. */
  | 'DEGRADED'
  /** Last successful update is older than the staleness threshold. */
  | 'STALE'
  /** Running on the mock provider on purpose. */
  | 'SIMULATED'
  /** Unreachable and no usable data. */
  | 'OFFLINE'

/** One immutable read of the market at a point in time. */
export interface MarketSnapshot {
  status: MarketStatus
  dataMode: DataMode
  /** Provider name, e.g. "Binance public REST" or "Mock Market Data Provider". */
  dataSource: string
  symbol: string
  timeframe: Timeframe
  candles: Candle[]
  /** Latest traded price, or the last close when no ticker is available. */
  price: number | undefined
  /** UTC ms of the last SUCCESSFUL update. Undefined when nothing has loaded. */
  lastUpdate: number | undefined
  /** Human-readable reason the feed is not LIVE, when applicable. */
  error: string | undefined
}

/* ------------------------------------------------------------------ *
 * V3: published (immutable) signals
 * ------------------------------------------------------------------ */

/**
 * Lifecycle of a published signal. Values only ever move forward; a
 * published signal's price levels and timestamps are never rewritten.
 */
export type PublishedSignalState =
  | 'ACTIVE'
  | 'EXPIRED'
  | 'IN_TRADE'
  | 'TARGET_HIT'
  | 'STOP_HIT'
  | 'CLOSED'

/**
 * A signal that has been published to the permanent record. The fields
 * inherited from Signal (action, entry zone, target, invalidation,
 * timestamp, strategy, timeframe) are LOCKED at publication — see
 * SignalPublisher. Only `state` and the observed-outcome fields advance.
 */
export interface PublishedSignal extends Signal {
  state: PublishedSignalState
  publishedAt: number
  expiresAt: number
  dataMode: DataMode
  dataSource: string
  /** Price of the market at the moment of publication (for the audit record). */
  marketPriceAtPublish: number
  /** Set once the market resolved the setup; never edited afterward. */
  resolvedAt?: number
  resolvedPrice?: number
}

/* ------------------------------------------------------------------ *
 * V3: paper trading
 * ------------------------------------------------------------------ */

export type PaperTradeStatus = 'OPEN' | 'CLOSED'

export type PaperTradeOutcome =
  | 'TARGET_HIT'
  | 'STOP_HIT'
  | 'USER_CLOSED'
  | 'EXPIRED_FLAT'

export type PaperTradeDirection = 'BUY' | 'SELL'

export interface PaperTrade {
  id: string
  signalId: string
  symbol: string
  direction: PaperTradeDirection
  status: PaperTradeStatus
  /** Virtual units of the base asset. */
  quantity: number
  /** Fill price after spread + slippage assumptions were applied. */
  entryPrice: number
  /** Mid price at the moment of entry, before costs (for transparency). */
  entryMidPrice: number
  target: number
  invalidation: number
  openedAt: number
  closedAt?: number
  exitPrice?: number
  outcome?: PaperTradeOutcome
  /** Realized P/L in virtual USD, net of assumed fees. */
  realizedPnl?: number
  realizedReturnPct?: number
  /** Total assumed fees charged across entry + exit, in virtual USD. */
  feesPaid: number
  /** Best/worst price reached while the trade was open (MFE/MAE inputs). */
  maxFavorablePrice: number
  maxAdversePrice: number
  /** Risk taken at entry, as a % of virtual equity at that moment. */
  riskPctAtEntry: number
  /** True when the user opened this after the signal's expiry (a rule violation). */
  enteredAfterExpiry: boolean
  dataMode: DataMode
}

export interface PaperPortfolio {
  startingCapital: number
  /** Cash + realized P/L. Does not include unrealized P/L on open trades. */
  balance: number
  trades: PaperTrade[]
}

/* ------------------------------------------------------------------ *
 * V3: discipline
 * ------------------------------------------------------------------ */

export type RuleViolationType =
  | 'LATE_ENTRY'
  | 'OVERSIZED_RISK'
  | 'OVERTRADING'
  | 'EARLY_CLOSE'

export interface RuleViolation {
  id: string
  type: RuleViolationType
  timestamp: number
  detail: string
}

export interface DisciplineScore {
  /** 0-100 overall. Never derived from profit alone. */
  overall: number
  riskManagement: number
  ruleAdherence: number
  entryDiscipline: number
  consistency: number
  /** Plain-language coaching note, strict but never shaming. */
  coachNote: string
  violations: RuleViolation[]
}
