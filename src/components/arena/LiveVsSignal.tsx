import type { PublishedSignal } from '../../core/types'
import { formatPct, formatUsd } from '../../utils/format'
import { Panel } from '../instrument/Panel'

interface LiveVsSignalProps {
  signal: PublishedSignal | undefined
  price: number | undefined
}

function distance(from: number, to: number): string {
  const pct = ((to - from) / from) * 100
  return `${formatUsd(Math.abs(to - from))} (${formatPct(pct)})`
}

const STATE_COPY: Record<PublishedSignal['state'], string> = {
  ACTIVE: 'Signal window open',
  EXPIRED: 'Window closed without resolution',
  IN_TRADE: 'Paper position open against this signal',
  TARGET_HIT: 'Market reached the target',
  STOP_HIT: 'Market reached the invalidation',
  CLOSED: 'Position closed',
}

/**
 * Side-by-side of what SignalLab said at publication versus what the
 * market is doing now. This is the honesty centerpiece: the left column
 * is frozen forever, the right column is live.
 */
export function LiveVsSignal({ signal, price }: LiveVsSignalProps) {
  if (!signal) {
    return (
      <Panel title="SignalLab vs Live Market">
        <p className="py-6 text-center text-xs text-ink-dim">
          No signal has been published yet. Once one is, this panel freezes what SignalLab said and
          tracks what the market actually did afterward.
        </p>
      </Panel>
    )
  }

  return (
    <Panel title="SignalLab vs Live Market">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="label mb-3 text-instrument">At publication (locked)</p>
          <dl className="tabular space-y-2 text-xs">
            <Row label="Market price" value={formatUsd(signal.marketPriceAtPublish)} />
            <Row label="Signal" value={signal.action} />
            <Row
              label="Entry zone"
              value={`${formatUsd(signal.entryZone.low)} – ${formatUsd(signal.entryZone.high)}`}
            />
            <Row label="Target" value={signal.target ? formatUsd(signal.target) : '—'} />
            <Row label="Invalidation" value={signal.stopLoss ? formatUsd(signal.stopLoss) : '—'} />
            <Row label="Issued (UTC)" value={new Date(signal.publishedAt).toISOString().slice(11, 19)} />
          </dl>
        </div>

        <div>
          <p className="label mb-3 text-long">Current market</p>
          {price === undefined ? (
            <p className="text-xs text-short">
              Current price unavailable — we cannot show live distances right now.
            </p>
          ) : (
            <dl className="tabular space-y-2 text-xs">
              <Row label="Current price" value={formatUsd(price)} />
              <Row
                label="From entry"
                value={distance((signal.entryZone.low + signal.entryZone.high) / 2, price)}
              />
              <Row label="To target" value={signal.target ? distance(price, signal.target) : '—'} />
              <Row
                label="To invalidation"
                value={signal.stopLoss ? distance(price, signal.stopLoss) : '—'}
              />
              <Row label="State" value={signal.state.replace('_', ' ')} />
            </dl>
          )}
        </div>
      </div>

      <ol className="mt-5 flex flex-wrap items-center gap-2 border-t border-rule pt-4 text-[11px]">
        <Step done label="Signal issued" />
        <Arrow />
        <Step done={signal.state !== 'ACTIVE'} label="Market movement" />
        <Arrow />
        <Step
          done={['TARGET_HIT', 'STOP_HIT', 'CLOSED', 'EXPIRED'].includes(signal.state)}
          label="Target / invalidation / expiry"
        />
        <Arrow />
        <Step done={Boolean(signal.resolvedAt)} label={STATE_COPY[signal.state]} />
      </ol>
    </Panel>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule/60 pb-1.5">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  )
}

function Step({ done, label }: { done: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${done ? 'text-ink' : 'text-ink-faint'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-instrument' : 'bg-rule-bright'}`} />
      {label}
    </li>
  )
}

function Arrow() {
  return <span className="text-ink-faint">→</span>
}
