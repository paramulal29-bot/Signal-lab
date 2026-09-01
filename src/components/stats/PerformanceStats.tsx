import { calculatePerformance } from '../../core/performance/PerformanceCalculator'
import type { AssetMarketData } from '../../core/types'
import { formatPct } from '../../utils/format'
import { Card } from '../common/Card'

export function PerformanceStats({ markets }: { markets: AssetMarketData[] }) {
  const records = markets.flatMap((m) => m.records)
  const stats = calculatePerformance(records)

  const tiles = [
    { label: 'Number of Signals', value: String(stats.totalSignals), tone: 'text-white' },
    { label: 'Win Rate', value: formatPct(stats.winRatePct, false), tone: 'text-buy' },
    { label: 'Average Win', value: formatPct(stats.avgWinPct), tone: 'text-buy' },
    { label: 'Average Loss', value: formatPct(stats.avgLossPct), tone: 'text-sell' },
    {
      label: 'Profit Factor',
      value: stats.profitFactor === undefined ? '—' : stats.profitFactor.toFixed(2),
      tone: 'text-white',
    },
    { label: 'Max Drawdown', value: `-${stats.maxDrawdownPct.toFixed(2)}%`, tone: 'text-sell' },
  ]

  return (
    <Card>
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-white">Performance Statistics</h2>
      </div>
      <p className="mb-4 text-xs text-gray-500">
        Backtested on simulated history, all assets combined. This describes past simulated
        performance only &mdash; it is not a projection or guarantee of real-world results.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-lg border border-border bg-surface-alt p-3">
            <p className="text-xs text-gray-500">{tile.label}</p>
            <p className={`mt-1 text-lg font-bold ${tile.tone}`}>{tile.value}</p>
          </div>
        ))}
      </div>
      {stats.closedSignals === 0 && (
        <p className="mt-3 text-xs text-gray-500">
          No signals have closed yet in this simulated history, so these stats are all zero.
        </p>
      )}
    </Card>
  )
}
