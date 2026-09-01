import type { AssetMarketData, AssetSymbol } from '../../core/types'
import { MarketCard } from './MarketCard'

interface MarketCardGridProps {
  markets: AssetMarketData[]
  selectedAsset: AssetSymbol
  onSelectAsset: (asset: AssetSymbol) => void
}

export function MarketCardGrid({ markets, selectedAsset, onSelectAsset }: MarketCardGridProps) {
  return (
    <section id="markets" className="scroll-mt-20">
      <h2 className="mb-3 text-lg font-semibold text-white">Markets</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {markets.map((m) => (
          <MarketCard
            key={m.asset.symbol}
            data={m}
            selected={m.asset.symbol === selectedAsset}
            onSelect={() => onSelectAsset(m.asset.symbol)}
          />
        ))}
      </div>
    </section>
  )
}
