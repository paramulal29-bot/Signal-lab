import { formatDuration } from '../../hooks/useCountdown'

interface ChronographProps {
  /** Milliseconds remaining. */
  remainingMs: number
  /** Total window length, used to draw the arc. */
  totalMs: number
  label: string
  /** Shown in place of the countdown once the window has closed. */
  expiredLabel?: string
  size?: number
}

const TICK_COUNT = 60

/**
 * The signature countdown instrument: a circular chronograph with
 * precision tick marks and a depleting arc.
 *
 * Design restraint is deliberate — it reports time remaining, it does
 * not manufacture urgency. There is no flashing, no acceleration near
 * zero, and no language pushing anyone to act before it expires.
 */
export function Chronograph({
  remainingMs,
  totalMs,
  label,
  expiredLabel = 'EXPIRED',
  size = 168,
}: ChronographProps) {
  const expired = remainingMs <= 0
  const fraction = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0

  const center = size / 2
  const radius = center - 18
  const circumference = 2 * Math.PI * radius

  // Under a minute the arc turns amber — a state change, not an alarm.
  const arcColor = expired
    ? 'var(--color-short)'
    : remainingMs < 60_000
      ? 'var(--color-hold)'
      : 'var(--color-instrument)'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="timer"
        aria-label={`${label}: ${expired ? expiredLabel : formatDuration(remainingMs)}`}
      >
        {/* Bezel */}
        <circle cx={center} cy={center} r={radius + 10} fill="none" stroke="var(--color-rule)" strokeWidth={1} />

        {/* Precision tick marks */}
        {Array.from({ length: TICK_COUNT }, (_, i) => {
          const angle = (i / TICK_COUNT) * 2 * Math.PI - Math.PI / 2
          const major = i % 5 === 0
          const inner = radius + (major ? 2 : 5)
          const outer = radius + 8
          return (
            <line
              key={i}
              x1={center + Math.cos(angle) * inner}
              y1={center + Math.sin(angle) * inner}
              x2={center + Math.cos(angle) * outer}
              y2={center + Math.sin(angle) * outer}
              stroke={major ? 'var(--color-rule-bright)' : 'var(--color-rule)'}
              strokeWidth={major ? 1.5 : 1}
            />
          )
        })}

        {/* Track + depleting arc */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-panel-3)" strokeWidth={3} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={arcColor}
          strokeWidth={3}
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />

        {/* Sweep hand — a slow mechanical detail, disabled once expired */}
        {!expired && (
          <line
            className="sweep-hand"
            x1={center}
            y1={center}
            x2={center}
            y2={center - radius + 6}
            stroke="var(--color-rule-bright)"
            strokeWidth={1}
            style={{ transformOrigin: `${center}px ${center}px` }}
          />
        )}

        <text
          x={center}
          y={center - 2}
          textAnchor="middle"
          className="tabular"
          fill={expired ? 'var(--color-short)' : 'var(--color-ink)'}
          fontSize={expired ? 15 : 26}
          fontWeight={600}
        >
          {expired ? expiredLabel : formatDuration(remainingMs)}
        </text>
        <text
          x={center}
          y={center + 18}
          textAnchor="middle"
          fill="var(--color-ink-faint)"
          fontSize={9}
          letterSpacing={1.6}
        >
          {label}
        </text>
      </svg>
    </div>
  )
}
