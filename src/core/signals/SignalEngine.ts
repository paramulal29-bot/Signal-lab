import type { Strategy, StrategyContext } from '../strategies/Strategy'
import type { Candle, Signal } from '../types'
import type { SignalStore } from './SignalStore'

export interface SignalEngineResult {
  /** Every discrete crossover-event signal found across the candle history. */
  signals: Signal[]
  /** The strategy's read on the current, most-recent state (may be WAIT). */
  currentSignal: Signal
}

/**
 * Runs a Strategy over a candle history and reconciles the results with
 * a SignalStore: every historical signal is recorded, then closed out
 * against whichever signal comes after it — so both wins and losses land
 * in history, none silently dropped. This is the layer that turns "a
 * strategy function" into "a system with a persistent signal history."
 */
export class SignalEngine {
  private readonly store: SignalStore

  constructor(store: SignalStore) {
    this.store = store
  }

  run(candles: Candle[], strategy: Strategy, context: StrategyContext): SignalEngineResult {
    const signals = strategy.findSignals(candles, context)
    const currentSignal = strategy.currentSignal(candles, context)

    for (let i = 0; i < signals.length; i++) {
      const entrySignal = signals[i]
      this.store.record(entrySignal)

      const exitSignal = signals[i + 1]
      if (exitSignal) {
        const exitPrice = (exitSignal.entryZone.low + exitSignal.entryZone.high) / 2
        this.store.resolve(entrySignal.id, exitPrice, exitSignal.timestamp)
      }
    }

    // `currentSignal` is not recorded separately: whenever it reads
    // BUY/SELL, that direction is already represented by the most recent
    // crossover event above (still OPEN if unresolved). Recording both
    // would show the same open position twice in the signal history.

    return { signals, currentSignal }
  }
}
