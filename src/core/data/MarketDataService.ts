import { LIVE_SYMBOL, LIVE_TIMEFRAME, POLL_INTERVAL_MS, STALE_AFTER_MS } from '../config'
import { ASSETS } from '../assets'
import type { Candle, MarketSnapshot, MarketStatus, Timeframe } from '../types'
import { LiveMarketDataProvider } from './LiveMarketDataProvider'
import { MockMarketDataProvider } from './MockMarketDataProvider'

type Listener = (snapshot: MarketSnapshot) => void

/** Backoff schedule (ms) applied after consecutive failures. */
const BACKOFF_MS = [5_000, 10_000, 20_000, 30_000, 60_000]

/**
 * Owns the live market feed: polls the provider, tracks connection and
 * freshness state, and publishes immutable snapshots to subscribers.
 *
 * The rule this class exists to enforce: data is only ever labeled LIVE
 * when a fetch has actually succeeded recently. A failed refresh
 * degrades to DEGRADED (last good data, still retrying), then STALE once
 * it ages past the threshold, and OFFLINE when nothing usable was ever
 * loaded. Stale data is never relabeled as current.
 */
export class MarketDataService {
  private readonly live = new LiveMarketDataProvider()
  private readonly mock = new MockMarketDataProvider()
  private listeners = new Set<Listener>()

  private snapshot: MarketSnapshot = {
    status: 'CONNECTING',
    dataMode: 'LIVE',
    dataSource: this.live.name,
    symbol: LIVE_SYMBOL,
    timeframe: LIVE_TIMEFRAME,
    candles: [],
    price: undefined,
    lastUpdate: undefined,
    error: undefined,
  }

  private timer: ReturnType<typeof setTimeout> | undefined
  private staleTimer: ReturnType<typeof setInterval> | undefined
  private abort: AbortController | undefined
  private failureCount = 0
  private simulationMode = false
  private started = false

  getSnapshot(): MarketSnapshot {
    return this.snapshot
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener(this.snapshot)
    return () => {
      this.listeners.delete(listener)
      if (this.listeners.size === 0) this.stop()
    }
  }

  /** Begins polling. Safe to call repeatedly; only the first call starts a loop. */
  start(): void {
    if (this.started) return
    this.started = true
    void this.refresh()

    // Independently re-evaluate freshness, so data that simply stops
    // being refreshed is downgraded to STALE even while a fetch hangs.
    this.staleTimer = setInterval(() => this.evaluateStaleness(), 5_000)
  }

  stop(): void {
    this.started = false
    if (this.timer) clearTimeout(this.timer)
    if (this.staleTimer) clearInterval(this.staleTimer)
    this.timer = undefined
    this.staleTimer = undefined
    this.abort?.abort()
    this.abort = undefined
  }

  /** Switches to the mock provider on purpose (explicit user choice). */
  useSimulation(): void {
    this.simulationMode = true
    this.failureCount = 0
    void this.refresh()
  }

  /** Returns to the live provider and retries immediately. */
  useLive(): void {
    this.simulationMode = false
    this.failureCount = 0
    this.emit({ ...this.snapshot, status: 'CONNECTING', error: undefined })
    void this.refresh()
  }

  isSimulation(): boolean {
    return this.simulationMode
  }

  private emit(next: MarketSnapshot): void {
    this.snapshot = next
    for (const listener of this.listeners) listener(next)
  }

  private scheduleNext(delayMs: number): void {
    if (!this.started) return
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => void this.refresh(), delayMs)
  }

  private async refresh(): Promise<void> {
    if (this.simulationMode) {
      await this.refreshFromMock()
      return
    }

    this.abort?.abort()
    const controller = new AbortController()
    this.abort = controller

    try {
      const [candles, price] = await Promise.all([
        this.live.getCandles(LIVE_SYMBOL, LIVE_TIMEFRAME, controller.signal),
        this.live.getPrice(LIVE_SYMBOL, controller.signal),
      ])

      this.failureCount = 0
      this.emit({
        status: 'LIVE',
        dataMode: 'LIVE',
        dataSource: this.live.name,
        symbol: LIVE_SYMBOL,
        timeframe: LIVE_TIMEFRAME,
        candles,
        price,
        lastUpdate: Date.now(),
        error: undefined,
      })
      this.scheduleNext(POLL_INTERVAL_MS)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      this.handleFailure(error)
    }
  }

  private handleFailure(error: unknown): void {
    this.failureCount += 1
    const message = error instanceof Error ? error.message : 'Unknown market data error.'
    const hasUsableData = this.snapshot.candles.length > 0 && this.snapshot.lastUpdate !== undefined

    this.emit({
      ...this.snapshot,
      // Keep the last good candles, but never keep calling them LIVE.
      status: hasUsableData ? this.freshnessStatus(this.snapshot.lastUpdate) : 'OFFLINE',
      error: message,
    })

    const backoff = BACKOFF_MS[Math.min(this.failureCount - 1, BACKOFF_MS.length - 1)]
    this.scheduleNext(backoff)
  }

  /** DEGRADED while the last good data is still fresh; STALE once it ages out. */
  private freshnessStatus(lastUpdate: number | undefined): MarketStatus {
    if (lastUpdate === undefined) return 'OFFLINE'
    return Date.now() - lastUpdate > STALE_AFTER_MS ? 'STALE' : 'DEGRADED'
  }

  private evaluateStaleness(): void {
    const { status, lastUpdate } = this.snapshot
    if (this.simulationMode) return
    if (status === 'OFFLINE' || lastUpdate === undefined) return

    const aged = Date.now() - lastUpdate > STALE_AFTER_MS
    if (aged && status !== 'STALE') {
      this.emit({
        ...this.snapshot,
        status: 'STALE',
        error: this.snapshot.error ?? 'Market data has not refreshed recently.',
      })
    }
  }

  private async refreshFromMock(): Promise<void> {
    const candles = await this.mock.getCandles(ASSETS.BTC, LIVE_TIMEFRAME)
    this.emit({
      status: 'SIMULATED',
      dataMode: 'SIMULATED',
      dataSource: this.mock.name,
      symbol: LIVE_SYMBOL,
      timeframe: LIVE_TIMEFRAME,
      candles,
      price: candles[candles.length - 1]?.close,
      lastUpdate: Date.now(),
      error: undefined,
    })
    this.scheduleNext(POLL_INTERVAL_MS)
  }
}

/** Convenience helper used by the UI to describe a snapshot in words. */
export function describeStatus(status: MarketStatus): string {
  switch (status) {
    case 'CONNECTING':
      return 'Connecting to the live market feed'
    case 'LIVE':
      return 'Live public market data'
    case 'DEGRADED':
      return 'Last refresh failed — retrying, showing last known data'
    case 'STALE':
      return 'Market data is stale — do not treat these prices as current'
    case 'SIMULATED':
      return 'Simulated data — not a live market feed'
    case 'OFFLINE':
      return 'Live market data unavailable'
  }
}

/** The candle series a signal/chart should use, or null when unusable. */
export function usableCandles(snapshot: MarketSnapshot): Candle[] | null {
  if (snapshot.status === 'OFFLINE' || snapshot.candles.length === 0) return null
  return snapshot.candles
}

export type { Timeframe }
