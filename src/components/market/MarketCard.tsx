import { Line, LineChart, ResponsiveContainer } from 'recharts'
import type { AssetMarketData } from '../../core/types'
import { formatPct, formatUsd } from '../../utils/format'
import { Card } from '../common/Card'
import { SignalBadge } from '../common/SignalBadge'

interface MarketCardProps {
  data: AssetMarketData
  selected: boolean
  onSelect: () => void
}

export function MarketCard({ data, selected, onSelect }: MarketCardProps) {
  const { asset, currentPrice, changePct24h, currentSignal, candles } = data
  const isUp = changePct24h >= 0
  const sparkData = candles.slice(-30).map((c) => ({ close: c.close }))

  return (
    <button type="button" onClick={onSelect} className="text-left">
      <Card
        className={`h-full transition-colors ${
          selected ? 'border-purple-500/60 ring-1 ring-purple-500/40' : 'hover:border-gray-600'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-black"
              style={{ backgroundColor: asset.color }}
            >
              {asset.symbol.slice(0, 3)}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{asset.symbol}</p>
              <p className="text-xs text-gray-500">{asset.name}</p>
            </div>
          </div>
          <SignalBadge action={currentSignal.action} />
        </div>

        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-xl font-bold text-white">{formatUsd(currentPrice)}</p>
            <p className={`text-xs font-medium ${isUp ? 'text-buy' : 'text-sell'}`}>
              {formatPct(changePct24h)} · 24h
            </p>
          </div>
          <div className="h-10 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke={isUp ? 'var(--color-buy)' : 'var(--color-sell)'}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </button>
  )
}
