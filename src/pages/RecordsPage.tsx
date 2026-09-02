import { Lock } from 'lucide-react'
import { useArena } from '../hooks/useArena'
import type { PublishedSignal } from '../core/types'
import { formatUsd } from '../utils/format'
import { Panel } from '../components/instrument/Panel'

const STATE_STYLE: Record<PublishedSignal['state'], string> = {
  ACTIVE: 'border-instrument/50 bg-instrument/10 text-instrument',
  EXPIRED: 'border-hold/50 bg-hold/10 text-hold',
  IN_TRADE: 'border-instrument/50 bg-instrument/10 text-instrument',
  TARGET_HIT: 'border-long/50 bg-long/10 text-long',
  STOP_HIT: 'border-short/50 bg-short/10 text-short',
  CLOSED: 'border-rule-bright bg-panel-3 text-ink-dim',
}

/**
 * The auditable signal record. Every signal SignalLab has published,
 * with its levels and timestamp exactly as they were at publication.
 * There is no edit or delete control here by design.
 */
export function RecordsPage() {
  const { publishedSignals } = useArena()

  const resolved = publishedSignals.filter((s) => s.state === 'TARGET_HIT' || s.state === 'STOP_HIT')
  const hits = resolved.filter((s) => s.state === 'TARGET_HIT').length

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <Panel
        title="Public signal record"
        action={
          <span className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] text-ink-faint">
            <Lock className="h-3 w-3" aria-hidden /> IMMUTABLE
          </span>
        }
      >
        <p className="mb-4 text-[11px] leading-relaxed text-ink-faint">
          Every signal below was recorded when it was published, with its entry zone, target,
          invalidation and timestamp locked at that moment. Nothing in this table can be edited from
          the interface, and losing signals are never removed. Statistics elsewhere in the app are
          calculated from these records — never typed in by hand.
        </p>

        {resolved.length > 0 && (
          <p className="tabular mb-4 text-xs text-ink-dim">
            {hits} of {resolved.length} resolved signals reached target
            {resolved.length - hits > 0 && ` · ${resolved.length - hits} hit invalidation`}
          </p>
        )}

        {publishedSignals.length === 0 ? (
          <p className="py-10 text-center text-xs text-ink-dim">
            No signals have been published yet. Signals appear here as soon as the strategy detects a
            valid setup on the live feed.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-xs">
              <thead>
                <tr className="label border-b border-rule">
                  <th className="py-2 pr-3 font-medium">Signal ID</th>
                  <th className="py-2 pr-3 font-medium">Issued (UTC)</th>
                  <th className="py-2 pr-3 font-medium">Signal</th>
                  <th className="py-2 pr-3 font-medium">Market @ publish</th>
                  <th className="py-2 pr-3 font-medium">Entry zone</th>
                  <th className="py-2 pr-3 font-medium">Target</th>
                  <th className="py-2 pr-3 font-medium">Invalidation</th>
                  <th className="py-2 pr-3 font-medium">Source</th>
                  <th className="py-2 pr-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {publishedSignals.map((signal) => (
                  <tr key={signal.id} className="border-b border-rule/60 last:border-0">
                    <td className="max-w-40 truncate py-2 pr-3 text-ink-faint" title={signal.id}>
                      {signal.id}
                    </td>
                    <td className="py-2 pr-3 text-ink-dim">
                      {new Date(signal.publishedAt).toISOString().slice(5, 19).replace('T', ' ')}
                    </td>
                    <td className={`py-2 pr-3 font-semibold ${signal.action === 'BUY' ? 'text-long' : 'text-short'}`}>
                      {signal.action}
                    </td>
                    <td className="py-2 pr-3 text-ink-dim">{formatUsd(signal.marketPriceAtPublish)}</td>
                    <td className="py-2 pr-3 text-ink-dim">
                      {formatUsd(signal.entryZone.low)}–{formatUsd(signal.entryZone.high)}
                    </td>
                    <td className="py-2 pr-3 text-long">{signal.target ? formatUsd(signal.target) : '—'}</td>
                    <td className="py-2 pr-3 text-short">
                      {signal.stopLoss ? formatUsd(signal.stopLoss) : '—'}
                    </td>
                    <td className="py-2 pr-3 text-ink-faint">
                      {signal.dataMode === 'LIVE' ? 'LIVE' : 'SIM'}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-block rounded-sm border px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] ${STATE_STYLE[signal.state]}`}
                      >
                        {signal.state.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
