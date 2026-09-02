import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { NextMove as NextMoveType } from '../../core/signals/lifecycle'

/**
 * One suggestion, one button. The whole point is that the user never
 * has to scan ten competing calls-to-action to know what to do next.
 */
export function NextMove({ move }: { move: NextMoveType }) {
  return (
    <section className="surface glow-instrument rounded-sm p-5">
      <p className="label">Your next move</p>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="text-xl font-bold tracking-tight text-ink">{move.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">{move.detail}</p>
        </div>

        <Link
          to={move.to}
          className="btn flex items-center gap-2 border border-instrument/50 bg-instrument/15 px-5 py-2.5 text-xs font-bold tracking-[0.14em] text-instrument hover:bg-instrument/25"
        >
          {move.actionLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  )
}
