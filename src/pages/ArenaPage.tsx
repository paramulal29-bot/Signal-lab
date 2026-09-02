import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertFeed, AlertSettingsPanel } from '../components/alerts/AlertHost'
import { ExecutionSequence } from '../components/arena/ExecutionSequence'
import { LiveChart } from '../components/arena/LiveChart'
import { LiveVsSignal } from '../components/arena/LiveVsSignal'
import { MarketStatusBar } from '../components/arena/MarketStatusBar'
import { PaperTradePanel } from '../components/arena/PaperTradePanel'
import { TradeResult } from '../components/arena/TradeResult'
import { TradeReview } from '../components/arena/TradeReview'
import { DisciplinePanel } from '../components/discipline/DisciplinePanel'
import { Panel } from '../components/instrument/Panel'
import { SystemBar } from '../components/instrument/SystemBar'
import { SignalStage } from '../components/signal/SignalStage'
import { useArena } from '../hooks/useArena'
import type { PaperTrade } from '../core/types'

export function ArenaPage() {
  const {
    snapshot,
    phase,
    now,
    activeSignal,
    latestSignal,
    openTrade,
    lastClosedTrade,
    balance,
    equity,
    discipline,
    alerts,
    nextAnalysisAt,
    progression,
    enterTrade,
    closeTrade,
    grantXp,
    useSimulation,
    useLive,
  } = useArena()

  /** Set briefly right after an entry, to play the execution readout. */
  const [executing, setExecuting] = useState<PaperTrade | undefined>()
  const [reviewOpen, setReviewOpen] = useState(false)
  const reviewRef = useRef<HTMLDivElement | null>(null)

  const dataUnavailable = snapshot.status === 'OFFLINE'
  const priceVerified =
    snapshot.price !== undefined && (snapshot.status === 'LIVE' || snapshot.status === 'SIMULATED')
  const canTrade = priceVerified && Boolean(activeSignal) && !openTrade

  const handleEnter = useCallback(
    (signal: NonNullable<typeof activeSignal>, riskPct: number) => {
      const result = enterTrade(signal, riskPct)
      if (result.ok) setExecuting(result.trade)
      return result
    },
    [enterTrade],
  )

  // Reviewing a completed decision is where the learning happens, so it
  // earns XP — once per trade.
  const openReview = useCallback(() => {
    setReviewOpen(true)
    if (lastClosedTrade) grantXp('TRADE_REVIEWED', `review-${lastClosedTrade.id}`)
    reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [lastClosedTrade, grantXp])

  useEffect(() => {
    if (openTrade) setReviewOpen(false)
  }, [openTrade])

  const utcClock = new Date(now).toISOString().slice(11, 19)

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
          className="border border-short/50 bg-short/10 px-4 py-3 text-sm text-short"
        >
          <p className="font-bold tracking-[0.14em]">LIVE DATA UNAVAILABLE</p>
          <p className="mt-1 text-xs text-ink-dim">
            We can&apos;t verify the current market price, so no signal is calculated and no paper
            trade can be opened. Switch to simulation to keep practicing on generated data — it is
            labeled as simulated everywhere.
          </p>
        </div>
      )}

      <AlertFeed alerts={alerts} />

      <SignalStage phase={phase} signal={latestSignal} nextAnalysisAt={nextAnalysisAt} />

      {executing && (
        <ExecutionSequence trade={executing} onDone={() => setExecuting(undefined)} />
      )}

      {phase === 'RESULT' && lastClosedTrade && !reviewOpen && (
        <TradeResult trade={lastClosedTrade} onReview={openReview} />
      )}

      <Panel title={`Live chart — ${snapshot.symbol} ${snapshot.timeframe}`}>
        {snapshot.candles.length === 0 ? (
          <p className="py-16 text-center text-xs text-ink-dim">
            {dataUnavailable ? 'No market data to chart.' : 'Loading market data…'}
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
          onEnter={handleEnter}
          onClose={closeTrade}
        />
        <LiveVsSignal signal={activeSignal ?? latestSignal} price={snapshot.price} />
      </div>

      <div ref={reviewRef}>
        <TradeReview trade={lastClosedTrade} />
      </div>

      <DisciplinePanel discipline={discipline} />

      <Panel title="Alert settings">
        <AlertSettingsPanel />
        <p className="mt-3 text-[11px] text-ink-faint">
          Alerts report state changes only. They never tell you to trade, and nothing here is timed
          to create urgency.
        </p>
      </Panel>

      <SystemBar
        snapshot={snapshot}
        signal={latestSignal}
        sessionCount={progression.sessionCount}
        utcClock={utcClock}
      />
    </div>
  )
}
