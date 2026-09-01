import { AlertTriangle, CircleDot, Loader2, WifiOff } from 'lucide-react'
import type { MarketStatus } from '../../core/types'

/**
 * Market feed status. Every state carries an icon AND a text label, so
 * the meaning never depends on color alone (accessibility §33).
 */
const STATUS_STYLE: Record<MarketStatus, { className: string; label: string }> = {
  CONNECTING: { className: 'border-rule-bright text-ink-dim', label: 'CONNECTING' },
  LIVE: { className: 'border-live/50 text-live', label: 'LIVE MARKET' },
  DEGRADED: { className: 'border-hold/50 text-hold', label: 'DEGRADED' },
  STALE: { className: 'border-hold/50 text-hold', label: 'DATA STALE' },
  SIMULATED: { className: 'border-instrument/50 text-instrument', label: 'SIMULATED' },
  OFFLINE: { className: 'border-short/50 text-short', label: 'OFFLINE' },
}

function StatusIcon({ status }: { status: MarketStatus }) {
  if (status === 'CONNECTING') return <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
  if (status === 'OFFLINE') return <WifiOff className="h-3 w-3" aria-hidden />
  if (status === 'DEGRADED' || status === 'STALE') return <AlertTriangle className="h-3 w-3" aria-hidden />
  return <CircleDot className={`h-3 w-3 ${status === 'LIVE' ? 'pulse-live' : ''}`} aria-hidden />
}

export function StatusPill({ status }: { status: MarketStatus }) {
  const style = STATUS_STYLE[status]
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] font-semibold tracking-[0.14em] ${style.className}`}
    >
      <StatusIcon status={status} />
      {style.label}
    </span>
  )
}
