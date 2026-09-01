import type { AssetSymbol, BacktestResult, BacktestStats, BacktestTrade, Candle, Signal } from './types'

/**
 * A very basic backtest: walk the historical crossover signals in order,
 * and treat every BUY/SELL as opening a trade that closes on the next
 * opposite signal (or stays OPEN if it's the most recent one). This is
 * meant to illustrate whether the strategy "would have worked" on the
 * mock history — it is not a realistic trading simulation (no fees,
 * slippage, position sizing, or partial fills).
 */
export function runBacktest(asset: AssetSymbol, candles: Candle[], signals: Signal[]): BacktestResult {
  const actionable = signals.filter((s) => s.action !== 'WAIT')
  const trades: BacktestTrade[] = []

  for (let i = 0; i < actionable.length; i++) {
    const entrySignal = actionable[i]
    const exitSignal = actionable[i + 1]
    const action = entrySignal.action as 'BUY' | 'SELL'

    const exitPrice = exitSignal ? exitSignal.entryPrice : null
    const exitTime = exitSignal ? candles[exitSignal.candleIndex].time : null

    let returnPct: number | null = null
    let outcome: BacktestTrade['outcome'] = 'OPEN'

    if (exitPrice !== null) {
      returnPct =
        action === 'BUY'
          ? ((exitPrice - entrySignal.entryPrice) / entrySignal.entryPrice) * 100
          : ((entrySignal.entryPrice - exitPrice) / entrySignal.entryPrice) * 100
      outcome = returnPct >= 0 ? 'WIN' : 'LOSS'
    }

    trades.push({
      id: entrySignal.id,
      asset,
      action,
      entryTime: candles[entrySignal.candleIndex].time,
      entryPrice: entrySignal.entryPrice,
      exitTime,
      exitPrice,
      returnPct,
      outcome,
    })
  }

  return { asset, trades, stats: computeStats(trades) }
}

function computeStats(trades: BacktestTrade[]): BacktestStats {
  const closed = trades.filter((t) => t.outcome !== 'OPEN' && t.returnPct !== null)
  const wins = closed.filter((t) => t.outcome === 'WIN')
  const losses = closed.filter((t) => t.outcome === 'LOSS')
  const returns = closed.map((t) => t.returnPct as number)

  return {
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    open: trades.length - closed.length,
    winRatePct: closed.length ? (wins.length / closed.length) * 100 : 0,
    avgReturnPct: returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0,
    bestTradePct: returns.length ? Math.max(...returns) : 0,
    worstTradePct: returns.length ? Math.min(...returns) : 0,
  }
}
