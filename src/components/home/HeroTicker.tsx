import { LIVE_SYMBOL_LABEL } from '../../core/config'
import type { MarketSnapshot } from '../../core/types'
import { useTickDirection } from '../../hooks/useAnimatedNumber'
import { formatPct, formatUsd } from '../../utils/format'
import { StatusPill } from '../instrument/StatusPill'

interface HeroTickerProps {
  snapshot: MarketSnapshot
  changePct: number | undefined
  utcClock: string
}

/**
 * The first thing a new user sees: what the market is doing, right now.
 *
 * The price flashes on a real tick only — `useTickDirection` fires from
 * an actual value change, so a still price stays still. Nothing here
 * simulates movement to look busy.
 */
export function HeroTicker({ snapshot, changePct, utcClock }: HeroTickerProps) {
  const direction = useTickDirection(snapshot.price)
  const isSimulated = snapshot.status === 'SIMULATED'

  return (
    <section className="relative overflow-hidden border-b border-rule">
      <div className="grid-backdrop absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-[0.2em] text-ink">SIGNALLAB</h1>
          <span className="label pt-1">Market Training System</span>
        </div>

        <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-5">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <StatusPill status={snapshot.status} />
              <span className="label">{LIVE_SYMBOL_LABEL}</span>
            </div>

            <p
              key={snapshot.price}
              className={`segment text-5xl font-bold sm:text-7xl ${
                direction === 'up' ? 'tick-up' : direction === 'down' ? 'tick-down' : 'text-ink'
              }`}
            >
              {snapshot.price === undefined ? '—' : formatUsd(snapshot.price)}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-4">
              {changePct !== undefined && (
                <span
                  className={`tabular text-sm font-semibold ${changePct >= 0 ? 'text-long' : 'text-short'}`}
                >
                  {formatPct(changePct)}
                  <span className="ml-1.5 text-ink-faint">24h</span>
                </span>
              )}
              <span className="tabular text-sm text-ink-faint">UTC {utcClock}</span>
            </div>
          </div>
        </div>

        {isSimulated && (
          <p className="mt-6 inline-block border border-instrument/40 bg-instrument/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-instrument">
            SIMULATED MARKET — GENERATED PRICES, NOT A LIVE FEED
          </p>
        )}
        {snapshot.status === 'OFFLINE' && (
          <p className="mt-6 inline-block border border-short/40 bg-short/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-short">
            LIVE MARKET DATA UNAVAILABLE — NO PRICE TO SHOW
          </p>
        )}
      </div>
    </section>
  )
}
