import type { SignalAction } from '../../core/types'

const STYLES: Record<SignalAction, string> = {
  BUY: 'bg-buy/15 text-buy border-buy/40',
  SELL: 'bg-sell/15 text-sell border-sell/40',
  WAIT: 'bg-wait/15 text-wait border-wait/40',
}

export function SignalBadge({ action, className = '' }: { action: SignalAction; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold tracking-wide ${STYLES[action]} ${className}`}
    >
      {action}
    </span>
  )
}
