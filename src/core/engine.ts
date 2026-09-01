import { ASSET_LIST } from './assets'
import { runBacktest } from './backtest'
import { generateMockCandles } from './mockData'
import { computeCrossoverSignals, computeLatestSignal } from './strategy'
import type { AssetMarketData } from './types'

/**
 * Builds the full mock market dataset SignalLab's dashboard runs on:
 * for each supported asset, generate a price history, run the SMA
 * crossover strategy over it, and backtest the resulting signals.
 *
 * This is the single entry point that wires the whole "core" together.
 */
export function buildMarketData(): AssetMarketData[] {
  return ASSET_LIST.map((asset) => {
    const candles = generateMockCandles(asset)
    const signals = computeCrossoverSignals(asset.symbol, candles)
    const latestSignal = computeLatestSignal(asset.symbol, candles)
    const backtest = runBacktest(asset.symbol, candles, signals)

    const currentPrice = candles[candles.length - 1].close
    const prevPrice = candles[candles.length - 2]?.close ?? currentPrice
    const changePct24h = ((currentPrice - prevPrice) / prevPrice) * 100

    return {
      asset,
      candles,
      currentPrice,
      changePct24h,
      signals,
      latestSignal,
      backtest,
    }
  })
}

export type * from './types'
