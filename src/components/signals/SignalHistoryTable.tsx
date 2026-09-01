import { useState } from 'react'
import type { AssetMarketData, SignalOutcome, SignalRecord } from '../../core/types'
import { formatDate, formatPct, formatUsd } from '../../utils/format'
import { Card } from '../common/Card'

type FilterKey = 'ALL' | SignalOutcome

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'WIN', label: 'Wins' },
  { key: 'LOSS', label: 'Losses' },
  { key: 'OPEN', label: 'Open' },
]

const OUTCOME_STYLES: Record<SignalOutcome, string> = {
  WIN: 'bg-buy/15 text-buy border-buy/40',
  LOSS: 'bg-sell/15 text-sell border-sell/40',
  OPEN: 'bg-wait/15 text-wait border-wait/40',
}

export function SignalHistoryTable({ markets }: { markets: AssetMarketData[] }) {
  const [filter, setFilter] = useState<FilterKey>('ALL')

  const records: SignalRecord[] = markets
    .flatMap((m) => m.records)
    .sort((a, b) => b.timestamp - a.timestamp)

  const filtered = filter === 'ALL' ? records : records.filter((r) => r.outcome === filter)

  return (
    <Card id="history" className="scroll-mt-20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Signal History</h2>
          <p className="text-xs text-gray-500">
            Every signal the strategy has produced on simulated data &mdash; wins and losses both recorded.
          </p>
        </div>
        <div className="flex gap-1.5 rounded-lg border border-border bg-surface-alt p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                filter === f.key ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-175 text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2 pr-3 font-medium">Asset</th>
              <th className="py-2 pr-3 font-medium">Action</th>
              <th className="py-2 pr-3 font-medium">Entry Zone</th>
              <th className="py-2 pr-3 font-medium">Exit</th>
              <th className="py-2 pr-3 font-medium">Return</th>
              <th className="py-2 pr-3 font-medium">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  No signals in this filter yet.
                </td>
              </tr>
            )}
            {filtered.map((record) => (
              <tr key={record.id} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 pr-3 font-semibold text-white">{record.asset}</td>
                <td className="py-2.5 pr-3 text-gray-300">{record.action}</td>
                <td className="py-2.5 pr-3 text-gray-300">
                  {formatUsd(record.entryZone.low)}&ndash;{formatUsd(record.entryZone.high)}
                  <span className="ml-1 text-xs text-gray-500">({formatDate(record.timestamp)})</span>
                </td>
                <td className="py-2.5 pr-3 text-gray-300">
                  {record.exitPrice ? formatUsd(record.exitPrice) : '—'}
                  {record.closedAt && (
                    <span className="ml-1 text-xs text-gray-500">({formatDate(record.closedAt)})</span>
                  )}
                </td>
                <td
                  className={`py-2.5 pr-3 font-medium ${
                    record.returnPct === undefined
                      ? 'text-gray-500'
                      : record.returnPct >= 0
                        ? 'text-buy'
                        : 'text-sell'
                  }`}
                >
                  {record.returnPct === undefined ? '—' : formatPct(record.returnPct)}
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${OUTCOME_STYLES[record.outcome]}`}
                  >
                    {record.outcome}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
