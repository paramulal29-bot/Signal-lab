import type { PaperTrade, RuleViolation } from '../types'

const TRADES_KEY = 'signallab.paper_trades.v1'
const VIOLATIONS_KEY = 'signallab.rule_violations.v1'

function read<T>(key: string): T[] {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, values: T[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(key, JSON.stringify(values))
  } catch {
    // Storage unavailable — the session keeps working from memory.
  }
}

/**
 * Persistence for paper trades and rule violations. Like the signal
 * record, this is append-and-advance only: trades are recorded when
 * opened and updated when closed, but losing trades are never removed.
 */
export class PaperTradeStore {
  private trades: PaperTrade[]
  private violations: RuleViolation[]

  constructor() {
    this.trades = read<PaperTrade>(TRADES_KEY)
    this.violations = read<RuleViolation>(VIOLATIONS_KEY)
  }

  list(): PaperTrade[] {
    return [...this.trades].sort((a, b) => b.openedAt - a.openedAt)
  }

  openTrade(): PaperTrade | undefined {
    return this.trades.find((t) => t.status === 'OPEN')
  }

  save(trade: PaperTrade): void {
    const index = this.trades.findIndex((t) => t.id === trade.id)
    if (index >= 0) {
      this.trades[index] = trade
    } else {
      this.trades.push(trade)
    }
    write(TRADES_KEY, this.trades)
  }

  recordViolation(violation: RuleViolation): void {
    if (this.violations.some((v) => v.id === violation.id)) return
    this.violations.push(violation)
    write(VIOLATIONS_KEY, this.violations)
  }

  listViolations(): RuleViolation[] {
    return [...this.violations].sort((a, b) => b.timestamp - a.timestamp)
  }

  /** Wipes the practice session. Only ever triggered by an explicit user action. */
  reset(): void {
    this.trades = []
    this.violations = []
    write(TRADES_KEY, this.trades)
    write(VIOLATIONS_KEY, this.violations)
  }
}
