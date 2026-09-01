import { paperTradingEngine } from '../../core/paper/PaperTradingEngine'
import type { PaperTrade } from '../../core/types'
import { formatDuration } from '../../hooks/useCountdown'
import { formatPct, formatUsd } from '../../utils/format'
import { OutcomeTag } from '../common/OutcomeTag'
import { Panel } from '../instrument/Panel'
import { Readout } from '../instrument/Readout'

/**
 * Post-trade debrief. Reports the result plainly — including losses —
 * and coaches on process rather than congratulating on profit.
 */
export function TradeReview({ trade }: { trade: PaperTrade | undefined }) {
  if (!trade) {
    return (
      <Panel title="Trade Review">
        <p className="py-6 text-center text-xs text-ink-dim">
          No completed practice trades yet. Every trade you close is reviewed here — wins and losses
          alike.
        </p>
      </Panel>
    )
  }

  const { mfePct, maePct } = paperTradingEngine.excursions(trade)
  const duration = trade.closedAt ? trade.closedAt - trade.openedAt : 0
  const pnl = trade.realizedPnl ?? 0

  return (
    <Panel title="Trade Review — most recent" action={<OutcomeTag outcome={trade.outcome} />}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Readout label="Entry" value={formatUsd(trade.entryPrice)} size="sm" />
        <Readout label="Exit" value={trade.exitPrice ? formatUsd(trade.exitPrice) : '—'} size="sm" />
        <Readout
          label="Result"
          value={formatUsd(pnl)}
          tone={pnl >= 0 ? 'long' : 'short'}
          size="sm"
          sub={trade.realizedReturnPct !== undefined ? formatPct(trade.realizedReturnPct) : undefined}
        />
        <Readout label="Duration" value={formatDuration(duration)} size="sm" tone="dim" />
        <Readout label="Max favorable" value={formatPct(mfePct)} tone="long" size="sm" />
        <Readout label="Max adverse" value={formatPct(maePct)} tone="short" size="sm" />
        <Readout label="Fees assumed" value={formatUsd(trade.feesPaid)} size="sm" tone="dim" />
        <Readout label="Risk at entry" value={formatPct(trade.riskPctAtEntry * 100, false)} size="sm" tone="dim" />
      </div>

      <div className="mt-5 border-t border-rule pt-4">
        <p className="label mb-1.5">Coach review</p>
        <p className="text-xs leading-relaxed text-ink-dim">{coachNote(trade)}</p>
      </div>
    </Panel>
  )
}

function coachNote(trade: PaperTrade): string {
  if (trade.enteredAfterExpiry) {
    return 'You entered after the signal had expired. The market outcome is not counted as a valid SignalLab strategy trade, and it is recorded as a rule violation. An expired setup is not a setup.'
  }

  switch (trade.outcome) {
    case 'TARGET_HIT':
      return 'You followed the entry and risk rules and the market reached the target. Note the process, not the profit — the same process will also produce losses.'
    case 'STOP_HIT':
      return 'Loss recorded. The invalidation did its job: it ended the trade at the price where your reason for taking it stopped being true. This is a cost of doing business, not a mistake.'
    case 'USER_CLOSED':
      return 'You closed this position manually before it reached the target or the invalidation. Check whether you exited on a plan or on a feeling — repeatedly cutting trades early shows up in your discipline score.'
    case 'EXPIRED_FLAT':
      return 'The position was closed without reaching either level. Review whether the setup was still valid when you entered.'
    default:
      return 'Trade recorded.'
  }
}
