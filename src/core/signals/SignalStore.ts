import type { Signal, SignalOutcome, SignalRecord } from '../types'

export interface SignalStoreFilter {
  asset?: Signal['asset']
  outcome?: SignalOutcome
}

/**
 * Contract for where signal history lives. This is deliberately
 * "database-shaped" (record / resolve / list / clear) even though the
 * only implementation today is local browser storage, so a real backend
 * (an API-backed store, a proper database) can replace it later without
 * touching the SignalEngine or the UI that reads from it.
 */
export interface SignalStore {
  /** Writes a signal into the store as OPEN. Idempotent — re-recording the same id is a no-op. */
  record(signal: Signal): SignalRecord
  /**
   * Closes a previously recorded signal at `exitPrice`. The resulting
   * return determines WIN vs LOSS — both outcomes are always recorded,
   * neither is ever dropped from history.
   */
  resolve(id: string, exitPrice: number, closedAt: number): SignalRecord | undefined
  list(filter?: SignalStoreFilter): SignalRecord[]
  clear(): void
}
