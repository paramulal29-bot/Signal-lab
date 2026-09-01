import type { AssetMarketData } from '../../core/types'
import { SignalCard } from './SignalCard'

export function SignalCardGrid({ markets }: { markets: AssetMarketData[] }) {
  return (
    <section id="signals" className="scroll-mt-20">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-white">Current Signals</h2>
        <p className="text-xs text-gray-500">
          {markets[0]?.currentSignal.strategyName} &middot; simulated data
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {markets.map((m) => (
          <SignalCard key={m.asset.symbol} data={m} />
        ))}
      </div>
    </section>
  )
}
