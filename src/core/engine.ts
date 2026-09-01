import { ASSET_LIST } from './assets'
import { DEFAULT_TIMEFRAME } from './config'
import type { MarketDataProvider } from './data/MarketDataProvider'
import { MockMarketDataProvider } from './data/MockMarketDataProvider'
import { LocalSignalStore } from './signals/LocalSignalStore'
import { SignalEngine } from './signals/SignalEngine'
import type { SignalStore } from './signals/SignalStore'
import { smaCrossoverStrategy } from './strategies/smaCrossoverStrategy'
import type { AssetMarketData } from './types'

/**
 * The active market-data provider. This is the ONLY place a live
 * provider needs to be swapped in later — everything downstream
 * (SignalEngine, strategies, the store, the UI) is written against the
 * MarketDataProvider interface, not this concrete mock class.
 */
const provider: MarketDataProvider = new MockMarketDataProvider()

/** The signal-history "database" — local storage today, an API-backed store later. */
export const signalStore: SignalStore = new LocalSignalStore()

const signalEngine = new SignalEngine(signalStore)

/**
 * Builds the full market dataset SignalLab's dashboard runs on: for each
 * supported asset, fetch a candle history from the current
 * MarketDataProvider, run the active strategy through the SignalEngine,
 * and read back that asset's recorded signal history (including any
 * losing signals — none are filtered out).
 */
export async function buildMarketData(): Promise<AssetMarketData[]> {
  return Promise.all(
    ASSET_LIST.map(async (asset): Promise<AssetMarketData> => {
      const candles = await provider.getCandles(asset, DEFAULT_TIMEFRAME)
      const context = { asset, timeframe: DEFAULT_TIMEFRAME, isSimulated: provider.isSimulated }
      const { signals, currentSignal } = signalEngine.run(candles, smaCrossoverStrategy, context)
      const records = signalStore.list({ asset: asset.symbol })

      const currentPrice = candles[candles.length - 1].close
      const prevPrice = candles[candles.length - 2]?.close ?? currentPrice
      const changePct24h = ((currentPrice - prevPrice) / prevPrice) * 100

      return {
        asset,
        timeframe: DEFAULT_TIMEFRAME,
        candles,
        currentPrice,
        changePct24h,
        signals,
        currentSignal,
        records,
      }
    }),
  )
}

export { DATA_MODE } from './config'
export type * from './types'
