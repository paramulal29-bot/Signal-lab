import { useState } from 'react'
import type { AssetMarketData, BacktestTrade, SignalOutcome } from '../../core/types'
import { formatPct, formatUsd } from '../../utils/format'
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

interface Row extends BacktestTrade {
  entryTimestamp: number
}

export function SignalHistoryTable({ markets }: { markets: AssetMarketData[] }) {
  const [filter, setFilter] = useState<FilterKey>('ALL')

  const rows: Row[] = markets
    .flatMap((m) =>
      m.backtest.trades.map((t) => {
        const signal = m.signals.find((s) => s.id === t.id)
        return { ...t, entryTimestamp: signal?.timestamp ?? 0 }
      }),
    )
    .sort((a, b) => b.entryTimestamp - a.entryTimestamp)

  const filtered = filter === 'ALL' ? rows : rows.filter((r) => r.outcome === filter)

  return (
    <Card id="history" className="scroll-mt-20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">Signal History</h2>
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
              <th className="py-2 pr-3 font-medium">Entry</th>
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
            {filtered.map((trade) => (
              <tr key={trade.id} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 pr-3 font-semibold text-white">{trade.asset}</td>
                <td className="py-2.5 pr-3 text-gray-300">{trade.action}</td>
                <td className="py-2.5 pr-3 text-gray-300">
                  {formatUsd(trade.entryPrice)}
                  <span className="ml-1 text-xs text-gray-500">({trade.entryTime})</span>
                </td>
                <td className="py-2.5 pr-3 text-gray-300">
                  {trade.exitPrice ? formatUsd(trade.exitPrice) : '—'}
                  {trade.exitTime && <span className="ml-1 text-xs text-gray-500">({trade.exitTime})</span>}
                </td>
                <td
                  className={`py-2.5 pr-3 font-medium ${
                    trade.returnPct === null ? 'text-gray-500' : trade.returnPct >= 0 ? 'text-buy' : 'text-sell'
                  }`}
                >
                  {trade.returnPct === null ? '—' : formatPct(trade.returnPct)}
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${OUTCOME_STYLES[trade.outcome]}`}
                  >
                    {trade.outcome}
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
