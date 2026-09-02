interface ReadoutProps {
  label: string
  value: string
  /** Optional secondary line under the value. */
  sub?: string
  tone?: 'default' | 'long' | 'short' | 'hold' | 'dim'
  size?: 'sm' | 'md' | 'lg'
}

const TONE: Record<NonNullable<ReadoutProps['tone']>, string> = {
  default: 'text-ink',
  long: 'text-long',
  short: 'text-short',
  hold: 'text-hold',
  dim: 'text-ink-dim',
}

const SIZE: Record<NonNullable<ReadoutProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
}

/** A single labeled telemetry value. Numbers are always tabular. */
export function Readout({ label, value, sub, tone = 'default', size = 'md' }: ReadoutProps) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className={`tabular mt-1 font-semibold ${SIZE[size]} ${TONE[tone]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-ink-faint">{sub}</p>}
    </div>
  )
}
