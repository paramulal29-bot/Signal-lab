import { Star } from 'lucide-react'
import type { AssetMarketData, AssetSymbol } from '../../core/types'
import { formatPct, formatUsd } from '../../utils/format'
import { Card } from '../common/Card'
import { SignalBadge } from '../common/SignalBadge'

interface WatchlistProps {
  markets: AssetMarketData[]
  watched: Set<AssetSymbol>
  onToggle: (asset: AssetSymbol) => void
}

export function Watchlist({ markets, watched, onToggle }: WatchlistProps) {
  return (
    <Card id="watchlist" className="scroll-mt-20">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-white">Watchlist</h2>
        <p className="text-xs text-gray-500">Click the star to track an asset</p>
      </div>

      <ul className="divide-y divide-border">
        {markets.map((m) => {
          const isWatched = watched.has(m.asset.symbol)
          return (
            <li key={m.asset.symbol} className="flex items-center justify-between gap-3 py-3">
              <button
                type="button"
                onClick={() => onToggle(m.asset.symbol)}
                aria-pressed={isWatched}
                aria-label={`${isWatched ? 'Remove' : 'Add'} ${m.asset.symbol} ${isWatched ? 'from' : 'to'} watchlist`}
                className="shrink-0 text-gray-500 transition-colors hover:text-wait"
              >
                <Star className={`h-4.5 w-4.5 ${isWatched ? 'fill-wait text-wait' : ''}`} />
              </button>

              <div className="flex flex-1 items-center gap-2.5">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-black"
                  style={{ backgroundColor: m.asset.color }}
                >
                  {m.asset.symbol.slice(0, 3)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{m.asset.symbol}</p>
                  <p className="text-xs text-gray-500">{m.asset.name}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-white">{formatUsd(m.currentPrice)}</p>
                <p className={`text-xs ${m.changePct24h >= 0 ? 'text-buy' : 'text-sell'}`}>
                  {formatPct(m.changePct24h)}
                </p>
              </div>

              <SignalBadge action={m.currentSignal.action} className="ml-1" />
            </li>
          )
        })}
      </ul>

      {watched.size === 0 && (
        <p className="mt-2 text-xs text-gray-500">
          Your watchlist is empty — star an asset above to pin it here.
        </p>
      )}
    </Card>
  )
}
