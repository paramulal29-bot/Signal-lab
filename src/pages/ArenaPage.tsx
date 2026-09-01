import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { AlertFeed, AlertSettingsPanel } from '../components/alerts/AlertHost'
import { LiveChart } from '../components/arena/LiveChart'
import { LiveVsSignal } from '../components/arena/LiveVsSignal'
import { MarketStatusBar } from '../components/arena/MarketStatusBar'
import { PaperTradePanel } from '../components/arena/PaperTradePanel'
import { SignalPanel } from '../components/arena/SignalPanel'
import { TradeReview } from '../components/arena/TradeReview'
import { DisciplinePanel } from '../components/discipline/DisciplinePanel'
import { Panel } from '../components/instrument/Panel'
import { useArena } from '../hooks/useArena'
import { arenaUnlocked, loadProgress } from '../core/academy/progress'

export function ArenaPage() {
  const arena = useArena()
  const progress = loadProgress()

  if (!arenaUnlocked(progress)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Panel title="Practice Arena — locked">
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Lock className="h-7 w-7 text-hold" aria-hidden />
            <h2 className="text-lg font-semibold text-ink">Complete the knowledge check first</h2>
            <p className="max-w-md text-sm text-ink-dim">
              The Practice Arena opens once you have passed the Beginner Academy knowledge check.
              Understanding entries, invalidation and position sizing before placing even a virtual
              trade is the entire point of this platform.
            </p>
            <Link
              to="/academy"
              className="mt-2 rounded-sm border border-instrument/50 bg-instrument/10 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-instrument transition-colors hover:bg-instrument/20"
            >
              GO TO ACADEMY
            </Link>
          </div>
        </Panel>
      </div>
    )
  }

  const {
    snapshot,
    currentSignal,
    activeSignal,
    latestSignal,
    openTrade,
    trades,
    balance,
    equity,
    discipline,
    alerts,
    nextAnalysisAt,
    enterTrade,
    closeTrade,
    useSimulation,
    useLive,
  } = arena

  const dataUnavailable = snapshot.status === 'OFFLINE'
  const priceVerified = snapshot.price !== undefined && (snapshot.status === 'LIVE' || snapshot.status === 'SIMULATED')
  const canTrade = priceVerified && Boolean(activeSignal) && !openTrade
  const lastClosedTrade = trades.find((t) => t.status === 'CLOSED')

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <MarketStatusBar
        snapshot={snapshot}
        nextAnalysisAt={nextAnalysisAt}
        onUseSimulation={useSimulation}
        onUseLive={useLive}
      />

      {dataUnavailable && (
        <div
          role="alert"
          className="rounded-sm border border-short/50 bg-short/10 px-4 py-3 text-sm text-short"
        >
          <p className="font-semibold tracking-wide">LIVE DATA UNAVAILABLE</p>
          <p className="mt-1 text-xs text-ink-dim">
            We can&apos;t verify the current market price, so no signal is calculated and no paper
            trade can be opened. You can switch to simulation mode to keep practicing on generated
            data — it will be labeled as simulated everywhere.
          </p>
        </div>
      )}

      <AlertFeed alerts={alerts} />

      <SignalPanel
        signal={activeSignal ?? latestSignal}
        currentSignal={currentSignal}
        dataUnavailable={dataUnavailable}
      />

      <Panel title={`Live Chart — ${snapshot.symbol} ${snapshot.timeframe}`}>
        {snapshot.candles.length === 0 ? (
          <p className="py-16 text-center text-xs text-ink-dim">
            {dataUnavailable
              ? 'No market data to chart.'
              : 'Loading market data…'}
          </p>
        ) : (
          <LiveChart
            candles={snapshot.candles}
            signal={activeSignal ?? latestSignal}
            muted={snapshot.status === 'STALE' || snapshot.status === 'DEGRADED'}
          />
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <PaperTradePanel
          signal={activeSignal}
          openTrade={openTrade}
          balance={balance}
          equity={equity}
          price={snapshot.price}
          canTrade={canTrade}
          onEnter={enterTrade}
          onClose={closeTrade}
        />
        <LiveVsSignal signal={activeSignal ?? latestSignal} price={snapshot.price} />
      </div>

      <TradeReview trade={lastClosedTrade} />

      <DisciplinePanel discipline={discipline} />

      <Panel title="Alert settings">
        <AlertSettingsPanel />
        <p className="mt-3 text-[11px] text-ink-faint">
          Alerts report state changes only. They never tell you to trade, and nothing here is timed
          to create urgency.
        </p>
      </Panel>
    </div>
  )
}
