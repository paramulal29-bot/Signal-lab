import {
  CartesianGrid,
  Legend,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from 'recharts'
import type { AssetMarketData, AssetSymbol } from '../../core/types'
import { FAST_PERIOD, SLOW_PERIOD } from '../../core/strategy'
import { sma } from '../../core/indicators'
import { formatUsd } from '../../utils/format'
import { Card } from '../common/Card'

interface MarketChartProps {
  markets: AssetMarketData[]
  selectedAsset: AssetSymbol
  onSelectAsset: (asset: AssetSymbol) => void
}

interface TooltipPayloadItem {
  name?: string
  value?: number
  color?: string
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-surface-alt p-3 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-white">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? formatUsd(entry.value) : entry.value}
        </p>
      ))}
    </div>
  )
}

export function MarketChart({ markets, selectedAsset, onSelectAsset }: MarketChartProps) {
  const market = markets.find((m) => m.asset.symbol === selectedAsset) ?? markets[0]
  const { candles, signals, asset } = market

  const fast = sma(candles, FAST_PERIOD)
  const slow = sma(candles, SLOW_PERIOD)
  const chartData = candles.map((c, i) => ({
    time: c.time,
    close: c.close,
    fastSma: fast[i],
    slowSma: slow[i],
  }))

  return (
    <section id="chart" className="scroll-mt-20">
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Market Chart</h2>
            <p className="text-xs text-gray-500">
              {asset.name} ({asset.symbol}) · Fast SMA({FAST_PERIOD}) / Slow SMA({SLOW_PERIOD}) with
              BUY/SELL markers
            </p>
          </div>
          <div className="flex gap-1.5 rounded-lg border border-border bg-surface-alt p-1">
            {markets.map((m) => (
              <button
                key={m.asset.symbol}
                type="button"
                onClick={() => onSelectAsset(m.asset.symbol)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  m.asset.symbol === selectedAsset
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {m.asset.symbol}
              </button>
            ))}
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232838" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                interval={Math.floor(chartData.length / 6)}
                axisLine={{ stroke: '#232838' }}
                tickLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={70}
                tickFormatter={(v: number) => formatUsd(v)}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              <Line
                type="monotone"
                dataKey="close"
                name="Price"
                stroke="#e5e7eb"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="fastSma"
                name={`SMA ${FAST_PERIOD}`}
                stroke="#22c55e"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="slowSma"
                name={`SMA ${SLOW_PERIOD}`}
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
              />
              {signals.map((signal) => (
                <ReferenceDot
                  key={signal.id}
                  x={candles[signal.candleIndex].time}
                  y={signal.entryPrice}
                  r={5}
                  fill={signal.action === 'BUY' ? '#22c55e' : '#ef4444'}
                  stroke="#0b0e14"
                  strokeWidth={2}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-buy" /> BUY marker
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sell" /> SELL marker
          </span>
          <span>Simulated daily candles &middot; demo data</span>
        </div>
      </Card>
    </section>
  )
}
