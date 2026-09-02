import { Link } from 'react-router-dom'
import { Radar } from 'lucide-react'
import { SIGNAL_VALIDITY_MS } from '../../core/config'
import { PHASE_PRESENTATION, type SignalPhase } from '../../core/signals/lifecycle'
import type { PublishedSignal } from '../../core/types'
import { useCountdown, formatDuration } from '../../hooks/useCountdown'
import { formatUsd } from '../../utils/format'
import { SegmentTimer } from '../instrument/SegmentTimer'

interface SignalStageProps {
  phase: SignalPhase
  signal: PublishedSignal | undefined
  nextAnalysisAt: number
  /** When set, renders a link to the arena instead of assuming it's already there. */
  ctaTo?: string
  ctaLabel?: string
}

const TONE_CLASS = {
  instrument: 'text-instrument',
  long: 'text-long',
  short: 'text-short',
  hold: 'text-hold',
  dim: 'text-ink-dim',
} as const

const GLOW_CLASS: Partial<Record<SignalPhase, string>> = {
  DETECTED: 'glow-instrument',
  ACTIVE: 'glow-instrument',
  EXPIRING: 'breathe-warn',
  IN_TRADE: 'glow-long',
  EXPIRED: 'glow-short',
}

/**
 * The centerpiece: what the strategy is doing right now.
 *
 * SCANNING is treated as a first-class state with its own presentation,
 * because a legitimate "no trade" has to feel like part of the system
 * working — not like a broken screen. No signal is ever fabricated to
 * fill this space.
 */
export function SignalStage({ phase, signal, nextAnalysisAt, ctaTo, ctaLabel }: SignalStageProps) {
  const presentation = PHASE_PRESENTATION[phase]
  const remaining = useCountdown(signal?.expiresAt)
  const untilScan = useCountdown(nextAnalysisAt)
  const showSetup = signal && phase !== 'SCANNING' && phase !== 'OFFLINE'

  return (
    <section
      key={phase}
      className={`surface rise-in rounded-sm ${GLOW_CLASS[phase] ?? ''}`}
      aria-live="polite"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2 w-2 rounded-full ${
              phase === 'SCANNING'
                ? 'bg-ink-faint pulse-live'
                : phase === 'EXPIRED' || phase === 'OFFLINE'
                  ? 'bg-short'
                  : phase === 'EXPIRING'
                    ? 'bg-hold pulse-live'
                    : 'bg-instrument pulse-live'
            }`}
          />
          <span className={`text-xs font-bold tracking-[0.16em] ${TONE_CLASS[presentation.tone]}`}>
            {presentation.status}
          </span>
        </div>
        {signal && showSetup && (
          <span className="tabular text-[10px] text-ink-faint">{signal.id}</span>
        )}
      </header>

      <div className="p-5">
        {!showSetup ? (
          /* ---------- SCANNING / OFFLINE ---------- */
          <div className="py-4">
            <div className="flex items-start gap-4">
              <Radar
                className={`mt-0.5 h-6 w-6 shrink-0 ${phase === 'OFFLINE' ? 'text-short' : 'text-ink-faint'}`}
                aria-hidden
              />
              <div className="flex-1">
                <p className="text-lg font-bold tracking-tight text-ink">
                  {phase === 'OFFLINE' ? 'NO MARKET CONNECTION' : 'NO VALID SETUP'}
                </p>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-dim">
                  {presentation.detail}
                </p>

                {phase === 'SCANNING' && (
                  <>
                    {/* Scan sweep — reports that the engine is cycling, nothing more. */}
                    <div className="relative mt-5 h-px w-full overflow-hidden bg-panel-3">
                      <div className="scan-bar absolute inset-y-0 w-1/4 bg-linear-to-r from-transparent via-instrument to-transparent" />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                      <span className="label">
                        Next scan{' '}
                        <span className="tabular ml-1 text-ink-dim">{formatDuration(untilScan)}</span>
                      </span>
                      {ctaTo && (
                        <Link
                          to={ctaTo}
                          className="btn border border-rule-bright px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-ink-dim hover:text-ink"
                        >
                          VIEW MARKET
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ---------- SETUP DETECTED / ACTIVE / EXPIRING / EXPIRED ---------- */
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-lg font-bold tracking-tight text-ink">
                  {signal.asset}/USDT
                </span>
                <span
                  className={`border px-2.5 py-1 text-xs font-bold tracking-[0.14em] ${
                    signal.action === 'BUY'
                      ? 'border-long/50 bg-long/10 text-long'
                      : 'border-short/50 bg-short/10 text-short'
                  }`}
                >
                  {signal.action}
                </span>
              </div>

              <dl className="mt-5 space-y-3">
                <div>
                  <dt className="label">Entry zone</dt>
                  <dd className="tabular mt-0.5 text-lg font-semibold text-ink">
                    {formatUsd(signal.entryZone.low)} — {formatUsd(signal.entryZone.high)}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="label">Target</dt>
                    <dd className="tabular mt-0.5 text-base font-semibold text-long">
                      {signal.target ? formatUsd(signal.target) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="label">Invalidation</dt>
                    <dd className="tabular mt-0.5 text-base font-semibold text-short">
                      {signal.stopLoss ? formatUsd(signal.stopLoss) : '—'}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            <div className="flex flex-col justify-between gap-4">
              <SegmentTimer
                remainingMs={remaining}
                totalMs={SIGNAL_VALIDITY_MS}
                expiring={phase === 'EXPIRING'}
                expiredLabel="00:00"
              />

              <div>
                <p
                  className={`text-xs font-semibold tracking-[0.12em] ${TONE_CLASS[presentation.tone]}`}
                >
                  {phase === 'EXPIRED' ? 'DO NOT ENTER — WAIT FOR NEW SETUP' : presentation.status}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-dim">
                  {presentation.detail}
                </p>

                {ctaTo && (
                  <Link
                    to={ctaTo}
                    className={`btn mt-4 inline-block border px-4 py-2 text-[11px] font-bold tracking-[0.14em] ${
                      phase === 'EXPIRED'
                        ? 'border-rule-bright text-ink-dim hover:text-ink'
                        : 'border-instrument/50 bg-instrument/15 text-instrument hover:bg-instrument/25'
                    }`}
                  >
                    {ctaLabel ?? (phase === 'EXPIRED' ? 'VIEW MARKET' : 'VIEW SETUP')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
