import type { RiskLevel } from '../../core/types'

const STYLES: Record<RiskLevel, string> = {
  Low: 'text-buy border-buy/40 bg-buy/10',
  Medium: 'text-wait border-wait/40 bg-wait/10',
  High: 'text-sell border-sell/40 bg-sell/10',
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${STYLES[level]}`}
    >
      {level} risk
    </span>
  )
}
