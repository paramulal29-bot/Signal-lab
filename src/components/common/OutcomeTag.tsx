import { Check, Clock, Minus, X } from 'lucide-react'
import type { PaperTradeOutcome } from '../../core/types'

/**
 * Trade outcome tag. Icon + text label always accompany the color, so
 * the state is never communicated by color alone (§33).
 */
const STYLE: Record<string, { className: string; label: string; Icon: typeof Check }> = {
  TARGET_HIT: { className: 'border-long/50 bg-long/10 text-long', label: 'WIN — TARGET', Icon: Check },
  STOP_HIT: { className: 'border-short/50 bg-short/10 text-short', label: 'LOSS — STOP', Icon: X },
  USER_CLOSED: { className: 'border-rule-bright bg-panel-3 text-ink-dim', label: 'USER CLOSED', Icon: Minus },
  EXPIRED_FLAT: { className: 'border-hold/50 bg-hold/10 text-hold', label: 'EXPIRED', Icon: Clock },
  OPEN: { className: 'border-instrument/50 bg-instrument/10 text-instrument', label: 'OPEN', Icon: Clock },
}

export function OutcomeTag({ outcome }: { outcome: PaperTradeOutcome | undefined }) {
  const style = STYLE[outcome ?? 'OPEN'] ?? STYLE.OPEN
  const { Icon } = style

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] ${style.className}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {style.label}
    </span>
  )
}
