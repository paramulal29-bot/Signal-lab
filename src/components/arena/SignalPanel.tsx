import { Ban, Clock } from 'lucide-react'
import { SIGNAL_VALIDITY_MS } from '../../core/config'
import type { PublishedSignal, Signal } from '../../core/types'
import { useCountdown } from '../../hooks/useCountdown'
import { formatUsd } from '../../utils/format'
import { Chronograph } from '../instrument/Chronograph'
import { Panel } from '../instrument/Panel'
import { Readout } from '../instrument/Readout'

interface SignalPanelProps {
  /** The published signal to display (active or the most recent one). */
  signal: PublishedSignal | undefined
  /** The strategy's live read, used to explain a WAIT state. */
  currentSignal: Signal | undefined
  dataUnavailable: boolean
}

const ACTION_STYLE: Record<string, string> = {
  BUY: 'border-long/50 bg-long/10 text-long',
  SELL: 'border-short/50 bg-short/10 text-short',
  WAIT: 'border-hold/50 bg-hold/10 text-hold',
}

export function SignalPanel({ signal, currentSignal, dataUnavailable }: SignalPanelProps) {
  const remaining = useCountdown(signal?.expiresAt)
  const expired = !signal || remaining <= 0 || signal.state === 'EXPIRED'

  if (dataUnavailable) {
    return (
      <Panel title="SignalLab Signal">
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Ban className="h-6 w-6 text-short" aria-hidden />
          <p className="text-sm font-semibold text-short">SIGNAL ENGINE UNAVAILABLE</p>
          <p className="max-w-sm text-xs text-ink-dim">
            No valid signal can currently be calculated, because the live market price cannot be
            verified.
          </p>
        </div>
      </Panel>
    )
  }

  if (!signal) {
    return (
      <Panel title="SignalLab Signal">
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Clock className="h-6 w-6 text-hold" aria-hidden />
          <p className="text-sm font-semibold tracking-wide text-hold">NO VALID SETUP</p>
          <p className="max-w-sm text-xs text-ink-dim">
            {currentSignal?.reasoning ??
              'Wait. The strategy has not detected a valid setup. Waiting is also a decision.'}
          </p>
        </div>
      </Panel>
    )
  }

  return (
    <Panel
      title="SignalLab Signal"
      action={
        <span
          className={`rounded-sm border px-2.5 py-1 text-[11px] font-bold tracking-[0.14em] ${ACTION_STYLE[signal.action]}`}
        >
          {signal.action}
        </span>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Readout
              label="Entry Zone"
              value={`${formatUsd(signal.entryZone.low)} – ${formatUsd(signal.entryZone.high)}`}
              size="sm"
            />
            <Readout
              label="Target"
              value={signal.target ? formatUsd(signal.target) : '—'}
              tone="long"
              size="sm"
            />
            <Readout
              label="Invalidation"
              value={signal.stopLoss ? formatUsd(signal.stopLoss) : '—'}
              tone="short"
              size="sm"
            />
            <Readout label="Risk Level" value={signal.riskLevel} size="sm" tone="dim" />
            <Readout label="Signal Strength" value={`${signal.strength} / 100`} size="sm" />
            <Readout label="Strategy" value={signal.strategyName} size="sm" tone="dim" />
          </div>

          <div>
            <p className="label mb-1.5">Why?</p>
            <p className="text-xs leading-relaxed text-ink-dim">{signal.reasoning}</p>
          </div>

          <dl className="grid grid-cols-2 gap-2 border-t border-rule pt-3 text-[11px] text-ink-faint">
            <dt>Signal issued</dt>
            <dd className="tabular text-right text-ink-dim">
              {new Date(signal.publishedAt).toUTCString().slice(17, 25)} UTC
            </dd>
            <dt>Data source</dt>
            <dd className="text-right text-ink-dim">{signal.dataSource}</dd>
            <dt>Signal ID</dt>
            <dd className="tabular truncate text-right text-ink-dim">{signal.id}</dd>
          </dl>
        </div>

        <div className="flex flex-col items-center justify-center gap-3">
          <Chronograph
            remainingMs={remaining}
            totalMs={SIGNAL_VALIDITY_MS}
            label="SIGNAL WINDOW"
            expiredLabel="EXPIRED"
          />
          {expired && (
            <p className="max-w-45 text-center text-[11px] font-semibold text-short">
              DO NOT ENTER. THIS SETUP HAS EXPIRED.
            </p>
          )}
        </div>
      </div>
    </Panel>
  )
}
