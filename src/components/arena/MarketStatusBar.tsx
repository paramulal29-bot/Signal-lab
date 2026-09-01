import { RefreshCw } from 'lucide-react'
import { LIVE_SYMBOL_LABEL } from '../../core/config'
import { describeStatus } from '../../core/data/MarketDataService'
import type { MarketSnapshot } from '../../core/types'
import { useCountdown, formatDuration } from '../../hooks/useCountdown'
import { formatUsd } from '../../utils/format'
import { StatusPill } from '../instrument/StatusPill'

interface MarketStatusBarProps {
  snapshot: MarketSnapshot
  nextAnalysisAt: number
  onUseSimulation: () => void
  onUseLive: () => void
}

export function MarketStatusBar({
  snapshot,
  nextAnalysisAt,
  onUseSimulation,
  onUseLive,
}: MarketStatusBarProps) {
  const untilAnalysis = useCountdown(nextAnalysisAt)
  const isSimulated = snapshot.status === 'SIMULATED'

  return (
    <div className="rounded-sm border border-rule bg-panel-1">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <StatusPill status={snapshot.status} />
          <div>
            <p className="label">{LIVE_SYMBOL_LABEL} · {snapshot.timeframe}</p>
            <p className="tabular text-xl font-semibold text-ink">
              {snapshot.price === undefined ? '—' : formatUsd(snapshot.price)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <div className="text-right">
            <p className="label">Last update</p>
            <p className="tabular text-xs text-ink-dim">
              {snapshot.lastUpdate
                ? `${new Date(snapshot.lastUpdate).toISOString().slice(11, 19)} UTC`
                : 'never'}
            </p>
          </div>
          <div className="text-right">
            <p className="label">Next analysis</p>
            <p className="tabular text-xs text-ink-dim">{formatDuration(untilAnalysis)}</p>
          </div>
          <button
            type="button"
            onClick={isSimulated ? onUseLive : onUseSimulation}
            className="flex items-center gap-1.5 rounded-sm border border-rule-bright px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-ink-dim transition-colors hover:text-ink"
          >
            <RefreshCw className="h-3 w-3" aria-hidden />
            {isSimulated ? 'TRY LIVE DATA' : 'USE SIMULATION'}
          </button>
        </div>
      </div>

      <p className="border-t border-rule px-4 py-2 text-[11px] text-ink-faint">
        {describeStatus(snapshot.status)}
        {snapshot.error ? ` — ${snapshot.error}` : ''}
        {snapshot.status === 'SIMULATED' &&
          ' All prices and signals below are generated, not real market activity.'}
      </p>
    </div>
  )
}
