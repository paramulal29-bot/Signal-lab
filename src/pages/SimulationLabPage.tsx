import { useEffect, useState } from 'react'
import { buildMarketData } from '../core/engine'
import type { AssetMarketData, AssetSymbol } from '../core/types'
import { LoadingScreen } from '../components/layout/LoadingScreen'
import { MarketCardGrid } from '../components/market/MarketCardGrid'
import { SignalCardGrid } from '../components/signals/SignalCardGrid'
import { MarketChart } from '../components/chart/MarketChart'
import { ActiveSignalsTable } from '../components/signals/ActiveSignalsTable'
import { SignalHistoryTable } from '../components/signals/SignalHistoryTable'
import { PerformanceStats } from '../components/stats/PerformanceStats'
import { Watchlist } from '../components/watchlist/Watchlist'

/**
 * The original multi-asset simulated dashboard, preserved intact from
 * V2. It runs entirely on the mock provider and its historical backtest
 * numbers are kept strictly separate from live paper-trading results.
 */
export function SimulationLabPage() {
  const [markets, setMarkets] = useState<AssetMarketData[] | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol | null>(null)
  const [watched, setWatched] = useState<Set<AssetSymbol>>(() => new Set(['BTC']))

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

  if (!markets || !selectedAsset) return <LoadingScreen />

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6">
      <div className="rounded-sm border border-instrument/40 bg-instrument/10 px-4 py-3">
        <p className="text-xs font-semibold tracking-[0.14em] text-instrument">
          SIMULATION LAB — GENERATED DATA
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-dim">
          Everything on this page is generated mock data across four assets, kept from the earlier
          version of SignalLab for strategy exploration. These backtest results are never mixed with
          live paper-trading performance.
        </p>
      </div>

      <MarketCardGrid markets={markets} selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />
      <SignalCardGrid markets={markets} />
      <MarketChart markets={markets} selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />
      <ActiveSignalsTable markets={markets} />
      <SignalHistoryTable markets={markets} />
      <PerformanceStats markets={markets} />
      <Watchlist markets={markets} watched={watched} onToggle={toggleWatch} />
    </div>
  )
}
