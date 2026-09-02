import { ArrowRight, MoveDown, MoveUp } from 'lucide-react'
import type { PulseQuote } from '../../core/data/LiveMarketDataProvider'
import { formatPct, formatUsd } from '../../utils/format'

const LABEL: Record<string, string> = {
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  SOLUSDT: 'SOL',
  BNBUSDT: 'BNB',
}

/** Flat band: inside this, the market is going sideways, not up or down. */
const FLAT_THRESHOLD_PCT = 0.15

function Direction({ changePct }: { changePct: number }) {
  if (changePct > FLAT_THRESHOLD_PCT) {
    return (
      <span className="flex items-center gap-1 text-long" aria-label="up">
        <MoveUp className="h-3.5 w-3.5" aria-hidden /> UP
      </span>
    )
  }
  if (changePct < -FLAT_THRESHOLD_PCT) {
    return (
      <span className="flex items-center gap-1 text-short" aria-label="down">
        <MoveDown className="h-3.5 w-3.5" aria-hidden /> DOWN
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-ink-dim" aria-label="flat">
      <ArrowRight className="h-3.5 w-3.5" aria-hidden /> FLAT
    </span>
  )
}

/**
 * Market pulse — ambient context, not a recommendation.
 *
 * Only BTC/USDT is traded by the strategy; these other markets are
 * shown so the environment reads as alive. When the live quotes are
 * unavailable, rows show "—" rather than inventing movement.
 */
export function MarketPulse({ quotes }: { quotes: PulseQuote[] | undefined }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="label">Market Pulse</h2>
        <span className="text-[10px] text-ink-faint">
          Context only · SignalLab trades BTC/USDT
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden border border-rule bg-rule sm:grid-cols-4">
        {Object.keys(LABEL).map((symbol) => {
          const quote = quotes?.find((q) => q.symbol === symbol)
          return (
            <div key={symbol} className="bg-panel-1 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-ink">{LABEL[symbol]}</span>
                <span className="text-[10px] font-semibold tracking-[0.12em]">
                  {quote ? <Direction changePct={quote.changePct24h} /> : <span className="text-ink-faint">—</span>}
                </span>
              </div>
              <p className="tabular mt-2 text-sm text-ink-dim">
                {quote ? formatUsd(quote.price) : '—'}
              </p>
              <p
                className={`tabular text-[11px] ${
                  quote ? (quote.changePct24h >= 0 ? 'text-long' : 'text-short') : 'text-ink-faint'
                }`}
              >
                {quote ? formatPct(quote.changePct24h) : 'no live quote'}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
