import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ASSETS } from '../core/assets'
import { ANALYSIS_INTERVAL_MS, LIVE_SYMBOL, LIVE_SYMBOL_LABEL, LIVE_TIMEFRAME } from '../core/config'
import type { PulseQuote } from '../core/data/LiveMarketDataProvider'
import { MarketDataService } from '../core/data/MarketDataService'
import { derivePhase, type SignalPhase } from '../core/signals/lifecycle'
import {
  awardXp,
  currentStreak,
  loadProgression,
  saveProgression,
  startSession,
  type ProgressionState,
  type XpReason,
} from '../core/progression/ProgressionEngine'
import { alertService, buildAlert, type SignalLabAlert } from '../core/alerts/AlertService'
import { calculateDiscipline, detectOvertrading } from '../core/discipline/DisciplineEngine'
import { paperTradingEngine, type OpenTradeResult } from '../core/paper/PaperTradingEngine'
import { PaperTradeStore } from '../core/paper/PaperTradeStore'
import { STARTING_CAPITAL } from '../core/paper/rules'
import { resolveAgainstCandles, SignalPublisher } from '../core/signals/SignalPublisher'
import { smaCrossoverStrategy } from '../core/strategies/smaCrossoverStrategy'
import type {
  MarketSnapshot,
  PaperTrade,
  PublishedSignal,
  RuleViolation,
  Signal,
} from '../core/types'

// Module-level singletons: one feed, one permanent record, one ledger
// for the whole app, regardless of how many components mount.
const marketService = new MarketDataService()
const publisher = new SignalPublisher()
const tradeStore = new PaperTradeStore()

export interface ArenaState {
  snapshot: MarketSnapshot
  /** The strategy's current read, whether or not it is actionable. */
  currentSignal: Signal | undefined
  /** The published signal inside its validity window, if any. */
  activeSignal: PublishedSignal | undefined
  /** The most recently published signal, active or not. */
  latestSignal: PublishedSignal | undefined
  publishedSignals: PublishedSignal[]
  openTrade: PaperTrade | undefined
  trades: PaperTrade[]
  violations: RuleViolation[]
  balance: number
  equity: number
  alerts: SignalLabAlert[]
  nextAnalysisAt: number
}

export function useArena() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot>(marketService.getSnapshot())
  const [pulse, setPulse] = useState<PulseQuote[] | undefined>(() => marketService.getPulse())
  const [progression, setProgression] = useState<ProgressionState>(() => loadProgression())
  const [nowTick, setNowTick] = useState(() => Date.now())
  const [publishedSignals, setPublishedSignals] = useState<PublishedSignal[]>(() => publisher.list())
  const [trades, setTrades] = useState<PaperTrade[]>(() => tradeStore.list())
  const [violations, setViolations] = useState<RuleViolation[]>(() => tradeStore.listViolations())
  const [alerts, setAlerts] = useState<SignalLabAlert[]>([])
  const [nextAnalysisAt, setNextAnalysisAt] = useState(() => Date.now() + ANALYSIS_INTERVAL_MS)

  const lastAlertedSignalId = useRef<string | undefined>(undefined)
  const expiryAlertedIds = useRef(new Set<string>())

  const pushAlert = useCallback((alert: SignalLabAlert) => {
    setAlerts((prev) => [alert, ...prev].slice(0, 6))
    alertService.fire(alert)
  }, [])

  /* ---------------- market feed ---------------- */

  useEffect(() => {
    const unsubscribe = marketService.subscribe(setSnapshot)
    const unsubscribePulse = marketService.subscribePulse(setPulse)
    marketService.start()
    return () => {
      unsubscribe()
      unsubscribePulse()
    }
  }, [])

  // One shared 1s clock drives the lifecycle phase and the UTC readout,
  // instead of every component reading Date.now() during render.
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Showing up is itself a training action: it starts a session and
  // keeps the streak alive. It awards no XP — XP comes from learning
  // and discipline, never from merely opening the page.
  useEffect(() => {
    setProgression((prev) => {
      const next = startSession(prev)
      if (next !== prev) saveProgression(next)
      return next
    })
  }, [])

  /* ---------------- signal generation ---------------- */

  const currentSignal = useMemo(() => {
    if (snapshot.candles.length < 40) return undefined
    return smaCrossoverStrategy.currentSignal(snapshot.candles, {
      asset: ASSETS.BTC,
      timeframe: LIVE_TIMEFRAME,
      isSimulated: snapshot.dataMode === 'SIMULATED',
    })
  }, [snapshot.candles, snapshot.dataMode])

  // Publish actionable setups to the permanent record. The id is keyed
  // to the candle that produced it, so re-polling the same hour cannot
  // republish (or restate) the same setup.
  useEffect(() => {
    if (!currentSignal || currentSignal.action === 'WAIT') return
    if (snapshot.status === 'OFFLINE' || snapshot.price === undefined) return

    const lastCandle = snapshot.candles[snapshot.candles.length - 1]
    if (!lastCandle) return

    const id = `${LIVE_SYMBOL}-${LIVE_TIMEFRAME}-${currentSignal.action}-${lastCandle.timestamp}`
    const record = publisher.publish(
      { ...currentSignal, id },
      {
        dataMode: snapshot.dataMode,
        dataSource: snapshot.dataSource,
        marketPrice: snapshot.price,
      },
    )

    setPublishedSignals(publisher.list())

    if (lastAlertedSignalId.current !== record.id && record.state === 'ACTIVE') {
      lastAlertedSignalId.current = record.id
      pushAlert(buildAlert('SIGNAL_ACTIVE', LIVE_SYMBOL_LABEL, record.action))
    }
  }, [currentSignal, snapshot.candles, snapshot.dataMode, snapshot.dataSource, snapshot.price, snapshot.status, pushAlert])

  // Expire signals whose window has closed, and resolve published
  // signals against subsequent price action. Runs on a slow tick.
  useEffect(() => {
    const tick = () => {
      const expired = publisher.expireStale()
      for (const record of expired) {
        if (!expiryAlertedIds.current.has(record.id)) {
          expiryAlertedIds.current.add(record.id)
          pushAlert(buildAlert('SIGNAL_EXPIRED', LIVE_SYMBOL_LABEL))
        }
      }

      let changed = expired.length > 0
      if (snapshot.candles.length > 0) {
        for (const record of publisher.list()) {
          if (record.state !== 'ACTIVE' && record.state !== 'EXPIRED') continue
          const resolution = resolveAgainstCandles(record, snapshot.candles)
          if (resolution) {
            publisher.advanceState(record.id, resolution.state, {
              resolvedAt: resolution.at,
              resolvedPrice: resolution.price,
            })
            changed = true
          }
        }
      }

      if (changed) setPublishedSignals(publisher.list())
    }

    tick()
    const id = setInterval(tick, 5_000)
    return () => clearInterval(id)
  }, [snapshot.candles, pushAlert])

  /* ---------------- next-analysis timer ---------------- */

  useEffect(() => {
    const id = setInterval(() => {
      setNextAnalysisAt((prev) => (prev <= Date.now() ? Date.now() + ANALYSIS_INTERVAL_MS : prev))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  /* ---------------- paper trade lifecycle ---------------- */

  const openTrade = useMemo(() => trades.find((t) => t.status === 'OPEN'), [trades])

  // Track excursions from the live price, and resolve against candles.
  useEffect(() => {
    if (!openTrade) return

    let updated = openTrade
    if (snapshot.price !== undefined) {
      updated = paperTradingEngine.trackPrice(updated, snapshot.price)
    }
    updated = paperTradingEngine.resolveAgainstCandles(updated, snapshot.candles)

    if (updated !== openTrade) {
      tradeStore.save(updated)
      setTrades(tradeStore.list())

      if (updated.status === 'CLOSED') {
        publisher.advanceState(
          updated.signalId,
          updated.outcome === 'TARGET_HIT' ? 'TARGET_HIT' : updated.outcome === 'STOP_HIT' ? 'STOP_HIT' : 'CLOSED',
          updated.closedAt && updated.exitPrice
            ? { resolvedAt: updated.closedAt, resolvedPrice: updated.exitPrice }
            : undefined,
        )
        setPublishedSignals(publisher.list())
        pushAlert(
          buildAlert(updated.outcome === 'TARGET_HIT' ? 'TARGET_REACHED' : 'STOP_REACHED', LIVE_SYMBOL_LABEL),
        )
      }
    }
  }, [openTrade, snapshot.price, snapshot.candles, pushAlert])

  const balance = useMemo(() => paperTradingEngine.balanceFrom(trades), [trades])

  const equity = useMemo(() => {
    if (!openTrade || snapshot.price === undefined) return balance
    return balance + paperTradingEngine.unrealizedPnl(openTrade, snapshot.price)
  }, [balance, openTrade, snapshot.price])

  /* ---------------- actions ---------------- */

  const enterTrade = useCallback(
    (signal: PublishedSignal, riskPct: number): OpenTradeResult => {
      const result = paperTradingEngine.openTrade(
        {
          signal,
          marketPrice: snapshot.price ?? Number.NaN,
          riskPct,
          equity: balance,
          dataMode: snapshot.dataMode,
        },
        Boolean(openTrade),
      )

      if (!result.ok) {
        if (result.code === 'RISK_LIMIT_EXCEEDED') {
          pushAlert(buildAlert('RULE_VIOLATION', LIVE_SYMBOL_LABEL, result.reason))
          const violation: RuleViolation = {
            id: `risk-${Date.now()}`,
            type: 'OVERSIZED_RISK',
            timestamp: Date.now(),
            detail: result.reason,
          }
          tradeStore.recordViolation(violation)
          setViolations(tradeStore.listViolations())
        }
        return result
      }

      tradeStore.save(result.trade)
      publisher.advanceState(signal.id, 'IN_TRADE')

      if (result.trade.enteredAfterExpiry) {
        const violation: RuleViolation = {
          id: `late-${result.trade.id}`,
          type: 'LATE_ENTRY',
          timestamp: result.trade.openedAt,
          detail: 'Entered after the signal had expired. This trade is excluded from strategy statistics.',
        }
        tradeStore.recordViolation(violation)
        pushAlert(buildAlert('RULE_VIOLATION', LIVE_SYMBOL_LABEL, 'You entered after the signal expired.'))
      }

      const nextTrades = tradeStore.list()
      if (detectOvertrading(nextTrades)) {
        const violation: RuleViolation = {
          id: `overtrade-${result.trade.id}`,
          type: 'OVERTRADING',
          timestamp: result.trade.openedAt,
          detail: 'More than five practice trades opened within an hour.',
        }
        tradeStore.recordViolation(violation)
      }

      setTrades(nextTrades)
      setViolations(tradeStore.listViolations())
      setPublishedSignals(publisher.list())
      return result
    },
    [balance, openTrade, snapshot.dataMode, snapshot.price, pushAlert],
  )

  const closeTrade = useCallback(() => {
    if (!openTrade || snapshot.price === undefined) return
    const closed = paperTradingEngine.closeAtMarket(openTrade, snapshot.price)
    tradeStore.save(closed)
    publisher.advanceState(closed.signalId, 'CLOSED', {
      resolvedAt: closed.closedAt ?? Date.now(),
      resolvedPrice: closed.exitPrice ?? snapshot.price,
    })
    setTrades(tradeStore.list())
    setPublishedSignals(publisher.list())
  }, [openTrade, snapshot.price])

  const resetPractice = useCallback(() => {
    tradeStore.reset()
    setTrades(tradeStore.list())
    setViolations(tradeStore.listViolations())
  }, [])

  const useSimulation = useCallback(() => marketService.useSimulation(), [])
  const useLive = useCallback(() => marketService.useLive(), [])

  const discipline = useMemo(() => calculateDiscipline(trades, violations), [trades, violations])

  const grantXp = useCallback((reason: XpReason, awardId: string) => {
    setProgression((prev) => {
      const next = awardXp(prev, reason, awardId)
      if (next !== prev) saveProgression(next)
      return next
    })
  }, [])

  const lastClosedTrade = useMemo(() => trades.find((t) => t.status === 'CLOSED'), [trades])

  const phase: SignalPhase = useMemo(
    () =>
      derivePhase({
        snapshot,
        signal: publishedSignals[0],
        openTrade,
        lastClosedTrade,
        now: nowTick,
      }),
    [snapshot, publishedSignals, openTrade, lastClosedTrade, nowTick],
  )

  // A closed trade that followed the rules earns discipline XP once.
  useEffect(() => {
    if (!lastClosedTrade) return
    if (lastClosedTrade.enteredAfterExpiry) return
    if (lastClosedTrade.riskPctAtEntry > 0.02) return
    grantXp('RULES_FOLLOWED', `rules-${lastClosedTrade.id}`)
  }, [lastClosedTrade, grantXp])

  const streak = useMemo(() => currentStreak(progression), [progression])

  // ACTIVE state is kept truthful by the expiry tick above, so this does
  // not need to re-read the clock during render.
  const activeSignal = useMemo(
    () => publishedSignals.find((s) => s.state === 'ACTIVE'),
    [publishedSignals],
  )

  return {
    snapshot,
    pulse,
    phase,
    now: nowTick,
    currentSignal,
    activeSignal,
    latestSignal: publishedSignals[0],
    publishedSignals,
    openTrade,
    lastClosedTrade,
    trades,
    violations,
    discipline,
    balance,
    equity,
    startingCapital: STARTING_CAPITAL,
    alerts,
    nextAnalysisAt,
    progression,
    streak,
    grantXp,
    enterTrade,
    closeTrade,
    resetPractice,
    useSimulation,
    useLive,
    isSimulation: marketService.isSimulation(),
  }
}
