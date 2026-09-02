import { useEffect, useRef, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import type { PaperTrade } from '../../core/types'
import { formatPct, formatUsd } from '../../utils/format'

const STEPS = ['EXECUTING PAPER ORDER', 'ORDER ACCEPTED', 'POSITION OPEN'] as const
const STEP_MS = 420

/**
 * A brief, professional order-execution readout.
 *
 * Deliberately plain: no confetti, no jackpot effect, no celebration.
 * Opening a position is a routine operation, and the animation exists
 * to confirm the system acted — not to make it feel like a win.
 */
export function ExecutionSequence({ trade, onDone }: { trade: PaperTrade; onDone: () => void }) {
  const [step, setStep] = useState(0)

  // `onDone` is held in a ref so the sequence runs exactly once per
  // trade. Depending on the callback directly would restart the timers
  // on every parent re-render (the arena re-renders each second), and
  // the sequence would never finish.
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    setStep(0)

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) {
      setStep(STEPS.length - 1)
      const id = setTimeout(() => onDoneRef.current(), 400)
      return () => clearTimeout(id)
    }

    const timers = STEPS.map((_, index) =>
      setTimeout(() => setStep(index), index * STEP_MS),
    )
    const done = setTimeout(() => onDoneRef.current(), STEPS.length * STEP_MS + 700)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(done)
    }
  }, [trade.id])

  return (
    <div className="surface glow-instrument rounded-sm p-5" aria-live="polite">
      <ol className="space-y-2.5">
        {STEPS.map((label, index) => {
          const reached = index <= step
          const complete = index < step
          return (
            <li
              key={label}
              className={`flex items-center gap-2.5 text-xs font-bold tracking-[0.14em] ${
                reached ? 'step-in text-ink' : 'text-ink-faint'
              }`}
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              {complete ? (
                <Check className="h-3.5 w-3.5 text-long" aria-hidden />
              ) : reached ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-instrument" aria-hidden />
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border border-rule-bright" />
              )}
              {label}
            </li>
          )
        })}
      </ol>

      {step >= STEPS.length - 1 && (
        <dl className="tabular rise-in mt-5 grid grid-cols-2 gap-4 border-t border-rule pt-4 text-xs sm:grid-cols-4">
          <div>
            <dt className="label">Direction</dt>
            <dd className={`mt-0.5 ${trade.direction === 'BUY' ? 'text-long' : 'text-short'}`}>
              {trade.direction}
            </dd>
          </div>
          <div>
            <dt className="label">Entry</dt>
            <dd className="mt-0.5 text-ink">{formatUsd(trade.entryPrice)}</dd>
          </div>
          <div>
            <dt className="label">Risk</dt>
            <dd className="mt-0.5 text-ink">{formatPct(trade.riskPctAtEntry * 100, false)}</dd>
          </div>
          <div>
            <dt className="label">Invalidation</dt>
            <dd className="mt-0.5 text-short">{formatUsd(trade.invalidation)}</dd>
          </div>
        </dl>
      )}
    </div>
  )
}
