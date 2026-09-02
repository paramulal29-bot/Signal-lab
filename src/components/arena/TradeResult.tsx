import { Check, X } from 'lucide-react'
import { evaluateTrade } from '../../core/paper/tradeQuality'
import type { PaperTrade } from '../../core/types'
import { formatUsd } from '../../utils/format'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'

const CHECK_LABELS = {
  riskControl: 'RISK CONTROL',
  entryDiscipline: 'ENTRY DISCIPLINE',
  ruleAdherence: 'RULE ADHERENCE',
  levelsRespected: 'LEVELS RESPECTED',
} as const

/**
 * The result screen. It leads with R — the outcome measured against the
 * risk taken — and then with decision quality, which is scored on
 * process alone. A disciplined loss reads as a job well done here.
 */
export function TradeResult({ trade, onReview }: { trade: PaperTrade; onReview: () => void }) {
  const quality = evaluateTrade(trade)
  const animatedR = useAnimatedNumber(quality.rMultiple, 700)
  const animatedQuality = useAnimatedNumber(quality.decisionQuality, 700)
  const positive = quality.rMultiple >= 0

  return (
    <section
      className={`surface rise-in rounded-sm ${positive ? 'glow-long' : 'glow-short'}`}
      aria-live="polite"
    >
      <header className="border-b border-rule px-5 py-3">
        <span className="text-xs font-bold tracking-[0.16em] text-ink">TRADE COMPLETE</span>
      </header>

      <div className="grid gap-6 p-5 md:grid-cols-[auto_1fr]">
        <div>
          <p className="label">Result</p>
          <p
            className={`segment mt-1 text-5xl font-bold ${positive ? 'text-long' : 'text-short'}`}
          >
            {animatedR >= 0 ? '+' : ''}
            {animatedR.toFixed(2)}R
          </p>
          <p className="tabular mt-1 text-xs text-ink-dim">
            {formatUsd(trade.realizedPnl ?? 0)} virtual
          </p>

          <p className="label mt-6">Decision quality</p>
          <p
            className={`segment mt-1 text-3xl font-bold ${
              quality.decisionQuality >= 85
                ? 'text-long'
                : quality.decisionQuality >= 60
                  ? 'text-hold'
                  : 'text-short'
            }`}
          >
            {Math.round(animatedQuality)}
            <span className="ml-1 text-sm font-medium text-ink-faint">/ 100</span>
          </p>
        </div>

        <div className="flex flex-col justify-between gap-5">
          <ul className="space-y-2">
            {(Object.keys(CHECK_LABELS) as (keyof typeof CHECK_LABELS)[]).map((key) => (
              <li key={key} className="flex items-center gap-2 text-xs">
                {quality.checks[key] ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-long" aria-hidden />
                ) : (
                  <X className="h-3.5 w-3.5 shrink-0 text-short" aria-hidden />
                )}
                <span className={quality.checks[key] ? 'text-ink-dim' : 'text-short'}>
                  {CHECK_LABELS[key]}
                </span>
                <span className="ml-auto text-[10px] tracking-[0.12em] text-ink-faint">
                  {quality.checks[key] ? 'PASS' : 'MISSED'}
                </span>
              </li>
            ))}
          </ul>

          <div>
            <p className="text-[11px] leading-relaxed text-ink-dim">{quality.note}</p>
            <button
              type="button"
              onClick={onReview}
              className="btn mt-4 border border-instrument/50 bg-instrument/15 px-4 py-2 text-[11px] font-bold tracking-[0.14em] text-instrument hover:bg-instrument/25"
            >
              REVIEW TRADE
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
