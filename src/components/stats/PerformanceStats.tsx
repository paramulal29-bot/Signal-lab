import type { AssetMarketData } from '../../core/types'
import { formatPct } from '../../utils/format'
import { Card } from '../common/Card'

function aggregate(markets: AssetMarketData[]) {
  const allTrades = markets.flatMap((m) => m.backtest.trades)
  const closed = allTrades.filter((t) => t.outcome !== 'OPEN' && t.returnPct !== null)
  const wins = closed.filter((t) => t.outcome === 'WIN')
  const returns = closed.map((t) => t.returnPct as number)

  return {
    totalSignals: allTrades.length,
    winRatePct: closed.length ? (wins.length / closed.length) * 100 : 0,
    avgReturnPct: returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0,
    bestTradePct: returns.length ? Math.max(...returns) : 0,
    worstTradePct: returns.length ? Math.min(...returns) : 0,
    openSignals: allTrades.length - closed.length,
  }
}

export function PerformanceStats({ markets }: { markets: AssetMarketData[] }) {
  const stats = aggregate(markets)

  const tiles = [
    { label: 'Total Signals', value: String(stats.totalSignals), tone: 'text-white' },
    { label: 'Win Rate', value: formatPct(stats.winRatePct, false), tone: 'text-buy' },
    {
      label: 'Avg. Return / Trade',
      value: formatPct(stats.avgReturnPct),
      tone: stats.avgReturnPct >= 0 ? 'text-buy' : 'text-sell',
    },
    { label: 'Best Trade', value: formatPct(stats.bestTradePct), tone: 'text-buy' },
    { label: 'Worst Trade', value: formatPct(stats.worstTradePct), tone: 'text-sell' },
    { label: 'Open Signals', value: String(stats.openSignals), tone: 'text-wait' },
  ]

  return (
    <Card>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-white">Performance Statistics</h2>
        <p className="text-xs text-gray-500">Backtested on simulated history, all assets combined</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-lg border border-border bg-surface-alt p-3">
            <p className="text-xs text-gray-500">{tile.label}</p>
            <p className={`mt-1 text-lg font-bold ${tile.tone}`}>{tile.value}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
