import type { Asset, Candle, Signal, Timeframe } from '../types'

export interface StrategyContext {
  asset: Asset
  timeframe: Timeframe
  isSimulated: boolean
}

/**
 * Contract every trading strategy implements. SignalLab ships one
 * strategy today (SMA crossover); this interface exists so a second one
 * can be added later without changing the SignalEngine that runs it.
 */
export interface Strategy {
  readonly name: string
  /** Every discrete BUY/SELL event found across the candle history (oldest first). */
  findSignals(candles: Candle[], context: StrategyContext): Signal[]
  /** The strategy's read on the most recent candle — may be WAIT. */
  currentSignal(candles: Candle[], context: StrategyContext): Signal
}
