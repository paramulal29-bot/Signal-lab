import type { Asset, AssetSymbol } from './types'

export const ASSETS: Record<AssetSymbol, Asset> = {
  BTC: { symbol: 'BTC', name: 'Bitcoin', basePrice: 64200, color: '#f7931a' },
  ETH: { symbol: 'ETH', name: 'Ethereum', basePrice: 3180, color: '#627eea' },
  SOL: { symbol: 'SOL', name: 'Solana', basePrice: 148, color: '#14f195' },
  BNB: { symbol: 'BNB', name: 'BNB', basePrice: 574, color: '#f3ba2f' },
}

export const ASSET_LIST: Asset[] = Object.values(ASSETS)
