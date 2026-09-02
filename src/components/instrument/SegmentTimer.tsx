import { formatDuration } from '../../hooks/useCountdown'

interface SegmentTimerProps {
  remainingMs: number
  totalMs: number
  /** Label under the digits. */
  label?: string
  /** Rendered instead of the digits once the window has closed. */
  expiredLabel?: string
  expiring?: boolean
  size?: 'md' | 'lg'
}

/**
 * The large segmented countdown — the loudest instrument on the page.
 *
 * It reports time and nothing else. There is no acceleration near zero,
 * no strobe, and no copy anywhere urging a decision before it runs out:
 * a closing window means "wait for the next setup", not "hurry up".
 */
export function SegmentTimer({
  remainingMs,
  totalMs,
  label = 'SIGNAL WINDOW',
  expiredLabel = 'CLOSED',
  expiring = false,
  size = 'lg',
}: SegmentTimerProps) {
  const expired = remainingMs <= 0
  const fraction = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0

  const tone = expired
    ? 'text-short'
    : expiring
      ? 'text-hold'
      : 'text-ink'

  const barTone = expired
    ? 'bg-short'
    : expiring
      ? 'bg-hold'
      : 'bg-instrument'

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-3">
        <span
          className={`segment font-semibold ${tone} ${size === 'lg' ? 'text-5xl sm:text-6xl' : 'text-3xl'}`}
          role="timer"
          aria-label={`${label}: ${expired ? expiredLabel : formatDuration(remainingMs)}`}
        >
          {expired ? expiredLabel : formatDuration(remainingMs)}
        </span>
        <span className="label pb-1.5">{label}</span>
      </div>

      {/* Linear depletion track with tick marks every 10%. */}
      <div className="relative mt-3 h-1.5 w-full overflow-hidden bg-panel-3">
        <div
          className={`meter-fill h-full ${barTone}`}
          style={{ width: `${fraction * 100}%` }}
        />
        <div className="pointer-events-none absolute inset-0 flex justify-between">
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i} className="h-full w-px bg-panel-0/70" />
          ))}
        </div>
      </div>
    </div>
  )
}
