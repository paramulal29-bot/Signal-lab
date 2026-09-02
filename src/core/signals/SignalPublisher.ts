import { SIGNAL_VALIDITY_MS } from '../config'
import type {
  Candle,
  DataMode,
  PublishedSignal,
  PublishedSignalState,
  Signal,
} from '../types'

const STORAGE_KEY = 'signallab.published_signals.v1'

/**
 * The permanent, append-only record of every signal SignalLab has
 * published.
 *
 * The integrity rules this class enforces:
 *
 *  1. A published signal's LOCKED fields — action, entry zone, target,
 *     invalidation, strategy, timeframe, timestamp, expiry — are frozen
 *     at publication and are never rewritten afterward.
 *  2. Publishing the same signal id twice is a no-op; the FIRST version
 *     is the one that stands.
 *  3. Only `state` and observed-outcome fields (resolvedAt/resolvedPrice)
 *     may advance, and only forward through the lifecycle.
 *  4. Nothing here deletes or edits a losing signal. There is no such API.
 *
 * If a bug ever produces a wrong record, the correct response is to
 * append a correction — not to silently rewrite history.
 */
export class SignalPublisher {
  private records = new Map<string, PublishedSignal>()
  private useMemoryOnly = false

  constructor() {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.useMemoryOnly = true
      return
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: PublishedSignal[] = JSON.parse(raw)
        for (const record of parsed) this.records.set(record.id, record)
      }
    } catch {
      this.useMemoryOnly = true
    }
  }

  private persist(): void {
    if (this.useMemoryOnly) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.records.values())))
    } catch {
      this.useMemoryOnly = true
    }
  }

  /**
   * Publishes a signal to the permanent record. Returns the record that
   * stands — which is the EXISTING one if this id was already published,
   * so a re-run of the strategy can never restate a past signal.
   */
  publish(
    signal: Signal,
    context: { dataMode: DataMode; dataSource: string; marketPrice: number; now?: number },
  ): PublishedSignal {
    const existing = this.records.get(signal.id)
    if (existing) return existing

    const publishedAt = context.now ?? Date.now()
    const record: PublishedSignal = {
      ...signal,
      state: 'ACTIVE',
      publishedAt,
      expiresAt: publishedAt + SIGNAL_VALIDITY_MS,
      dataMode: context.dataMode,
      dataSource: context.dataSource,
      marketPriceAtPublish: context.marketPrice,
    }

    this.records.set(record.id, Object.freeze(record))
    this.persist()
    return record
  }

  /**
   * Advances a published signal's lifecycle state. Price levels and
   * timestamps are untouched — only the observed outcome is appended.
   */
  advanceState(
    id: string,
    state: PublishedSignalState,
    observed?: { resolvedAt: number; resolvedPrice: number },
  ): PublishedSignal | undefined {
    const existing = this.records.get(id)
    if (!existing) return undefined
    if (isTerminal(existing.state)) return existing

    const updated: PublishedSignal = Object.freeze({
      ...existing,
      state,
      resolvedAt: observed?.resolvedAt ?? existing.resolvedAt,
      resolvedPrice: observed?.resolvedPrice ?? existing.resolvedPrice,
    })

    this.records.set(id, updated)
    this.persist()
    return updated
  }

  get(id: string): PublishedSignal | undefined {
    return this.records.get(id)
  }

  /** All published signals, newest first. Losses included, always. */
  list(): PublishedSignal[] {
    return Array.from(this.records.values()).sort((a, b) => b.publishedAt - a.publishedAt)
  }

  /** The most recent signal that is still inside its validity window. */
  activeSignal(now = Date.now()): PublishedSignal | undefined {
    return this.list().find((record) => record.state === 'ACTIVE' && record.expiresAt > now)
  }

  /**
   * Marks any ACTIVE signal whose window has closed as EXPIRED. Called on
   * each tick so the record reflects reality without user interaction.
   */
  expireStale(now = Date.now()): PublishedSignal[] {
    const expired: PublishedSignal[] = []
    for (const record of this.records.values()) {
      if (record.state === 'ACTIVE' && record.expiresAt <= now) {
        const updated = this.advanceState(record.id, 'EXPIRED')
        if (updated) expired.push(updated)
      }
    }
    return expired
  }
}

function isTerminal(state: PublishedSignalState): boolean {
  return state === 'TARGET_HIT' || state === 'STOP_HIT' || state === 'CLOSED'
}

/**
 * Checks whether a published signal has been resolved by subsequent
 * price action, using only candles that CLOSED after publication.
 * Returns the resolution, or null if the market has not resolved it yet.
 *
 * When a single candle touches both the target and the invalidation, the
 * true order within the candle is unknown, so we resolve conservatively
 * as the STOP being hit first. See core/paper/rules.ts for the rationale;
 * the same rule is applied to paper trades.
 */
export function resolveAgainstCandles(
  signal: PublishedSignal,
  candles: Candle[],
): { state: 'TARGET_HIT' | 'STOP_HIT'; at: number; price: number } | null {
  if (signal.target === undefined || signal.stopLoss === undefined) return null
  if (signal.action === 'WAIT') return null

  const isLong = signal.action === 'BUY'

  for (const candle of candles) {
    if (candle.timestamp <= signal.publishedAt) continue

    const hitTarget = isLong ? candle.high >= signal.target : candle.low <= signal.target
    const hitStop = isLong ? candle.low <= signal.stopLoss : candle.high >= signal.stopLoss

    if (hitStop) {
      // Conservative: if both were touched in one candle, the stop counts.
      return { state: 'STOP_HIT', at: candle.timestamp, price: signal.stopLoss }
    }
    if (hitTarget) {
      return { state: 'TARGET_HIT', at: candle.timestamp, price: signal.target }
    }
  }

  return null
}
