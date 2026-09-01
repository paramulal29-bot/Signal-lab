import type { Signal, SignalRecord } from '../types'
import type { SignalStore, SignalStoreFilter } from './SignalStore'

const STORAGE_KEY = 'signallab.signal_history.v1'

function computeReturnPct(record: SignalRecord, exitPrice: number): number {
  const entryMid = (record.entryZone.low + record.entryZone.high) / 2
  if (record.action === 'SELL') {
    return ((entryMid - exitPrice) / entryMid) * 100
  }
  return ((exitPrice - entryMid) / entryMid) * 100
}

/**
 * localStorage-backed SignalStore — the "mock database" for signal
 * history described in the architecture. Falls back to an in-memory Map
 * if localStorage is unavailable (private browsing, SSR, storage quota),
 * so the app degrades gracefully instead of throwing.
 */
export class LocalSignalStore implements SignalStore {
  private memory = new Map<string, SignalRecord>()
  private useMemoryOnly = false

  constructor() {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.useMemoryOnly = true
      return
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const records: SignalRecord[] = JSON.parse(raw)
        for (const record of records) this.memory.set(record.id, record)
      }
    } catch {
      this.useMemoryOnly = true
    }
  }

  private persist(): void {
    if (this.useMemoryOnly) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.memory.values())))
    } catch {
      // Storage full or unavailable mid-session — keep working in memory only.
      this.useMemoryOnly = true
    }
  }

  record(signal: Signal): SignalRecord {
    const existing = this.memory.get(signal.id)
    if (existing) return existing

    const record: SignalRecord = { ...signal, outcome: 'OPEN' }
    this.memory.set(record.id, record)
    this.persist()
    return record
  }

  resolve(id: string, exitPrice: number, closedAt: number): SignalRecord | undefined {
    const existing = this.memory.get(id)
    if (!existing) return undefined

    const returnPct = computeReturnPct(existing, exitPrice)
    const resolved: SignalRecord = {
      ...existing,
      outcome: returnPct >= 0 ? 'WIN' : 'LOSS',
      exitPrice,
      returnPct,
      closedAt,
    }
    this.memory.set(id, resolved)
    this.persist()
    return resolved
  }

  list(filter?: SignalStoreFilter): SignalRecord[] {
    let records = Array.from(this.memory.values())
    if (filter?.asset) records = records.filter((r) => r.asset === filter.asset)
    if (filter?.outcome) records = records.filter((r) => r.outcome === filter.outcome)
    return records.sort((a, b) => b.timestamp - a.timestamp)
  }

  clear(): void {
    this.memory.clear()
    if (!this.useMemoryOnly) {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        // Nothing else to do — memory is already cleared.
      }
    }
  }
}
