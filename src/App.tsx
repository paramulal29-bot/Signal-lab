import { useEffect, useState } from 'react'
import { buildMarketData } from './core/engine'
import type { AssetMarketData, AssetSymbol } from './core/types'
import { Header } from './components/layout/Header'
import { DisclosureBanner } from './components/layout/DisclosureBanner'
import { Footer } from './components/layout/Footer'
import { RiskDisclosure } from './components/layout/RiskDisclosure'
import { LoadingScreen } from './components/layout/LoadingScreen'
import { MarketCardGrid } from './components/market/MarketCardGrid'
import { SignalCardGrid } from './components/signals/SignalCardGrid'
import { MarketChart } from './components/chart/MarketChart'
import { ActiveSignalsTable } from './components/signals/ActiveSignalsTable'
import { SignalHistoryTable } from './components/signals/SignalHistoryTable'
import { PerformanceStats } from './components/stats/PerformanceStats'
import { Watchlist } from './components/watchlist/Watchlist'
import { FreeVsPro } from './components/pricing/FreeVsPro'

export default function App() {
  const [markets, setMarkets] = useState<AssetMarketData[] | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol | null>(null)
  const [watched, setWatched] = useState<Set<AssetSymbol>>(() => new Set(['BTC']))

  // The engine fetches candles through a MarketDataProvider (mock today,
  // potentially a live API later) and runs the strategy — both are async,
  // so the dashboard loads its data rather than computing it inline.
  useEffect(() => {
    let cancelled = false

    buildMarketData().then((data) => {
      if (cancelled) return
      setMarkets(data)
      setSelectedAsset((prev) => prev ?? data[0].asset.symbol)
    })

    return () => {
      cancelled = true
    }
  }, [])

  function toggleWatch(asset: AssetSymbol) {
    setWatched((prev) => {
      const next = new Set(prev)
      if (next.has(asset)) {
        next.delete(asset)
      } else {
        next.add(asset)
      }
      return next
    })
  }

  if (!markets || !selectedAsset) {
    return <LoadingScreen />
  }

  return (
    <div id="top" className="min-h-screen bg-bg">
      <Header />
      <DisclosureBanner />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
        <MarketCardGrid markets={markets} selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />

        <SignalCardGrid markets={markets} />

        <MarketChart markets={markets} selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />

        <ActiveSignalsTable markets={markets} />

        <SignalHistoryTable markets={markets} />

        <PerformanceStats markets={markets} />

        <Watchlist markets={markets} watched={watched} onToggle={toggleWatch} />

        <RiskDisclosure />

        <FreeVsPro />
      </main>

      <Footer />
    </div>
  )
}
