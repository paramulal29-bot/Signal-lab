import type { MarketSnapshot, PublishedSignal } from '../../core/types'

interface SystemBarProps {
  snapshot: MarketSnapshot
  signal: PublishedSignal | undefined
  sessionCount: number
  utcClock: string
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="label">{label}</p>
      <p className="tabular mt-0.5 truncate text-[11px] text-ink-dim">{value}</p>
    </div>
  )
}

/**
 * The cockpit strip: system identity, feed state and the clock. It has
 * no interactive purpose — it exists so the environment reads as an
 * instrument that is switched on and reporting its own status.
 */
export function SystemBar({ snapshot, signal, sessionCount, utcClock }: SystemBarProps) {
  return (
    <section className="grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-3 lg:grid-cols-6">
      <div className="bg-panel-1 p-3">
        <Field label="System" value="SignalLab v4" />
      </div>
      <div className="bg-panel-1 p-3">
        <Field label="Market" value={snapshot.symbol} />
      </div>
      <div className="bg-panel-1 p-3">
        <Field label="Data" value={snapshot.status} />
      </div>
      <div className="bg-panel-1 p-3">
        {/* A short, traceable reference rather than the raw id, which ends
            in a candle timestamp and reads as noise on the panel. */}
        <Field
          label="Signal"
          value={signal ? `${signal.action}-${signal.id.slice(-6)}` : 'none'}
        />
      </div>
      <div className="bg-panel-1 p-3">
        <Field label="UTC" value={utcClock} />
      </div>
      <div className="bg-panel-1 p-3">
        <Field label="Session" value={String(sessionCount).padStart(2, '0')} />
      </div>
    </section>
  )
}
