import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { LIVE_SYMBOL_LABEL } from '../../core/config'
import { paperTradingEngine } from '../../core/paper/PaperTradingEngine'
import { DEFAULT_RISK_PCT, MAX_RISK_PCT, STARTING_CAPITAL } from '../../core/paper/rules'
import type { PaperTrade, PublishedSignal } from '../../core/types'
import { useElapsed, formatDuration } from '../../hooks/useCountdown'
import { formatPct, formatUsd } from '../../utils/format'
import { Panel } from '../instrument/Panel'
import { Readout } from '../instrument/Readout'

interface PaperTradePanelProps {
  signal: PublishedSignal | undefined
  openTrade: PaperTrade | undefined
  balance: number
  equity: number
  price: number | undefined
  canTrade: boolean
  onEnter: (signal: PublishedSignal, riskPct: number) => { ok: boolean; reason?: string }
  onClose: () => void
}

const RISK_CHOICES = [0.005, 0.01, 0.02]

export function PaperTradePanel({
  signal,
  openTrade,
  balance,
  equity,
  price,
  canTrade,
  onEnter,
  onClose,
}: PaperTradePanelProps) {
  const [riskPct, setRiskPct] = useState(DEFAULT_RISK_PCT)
  const [error, setError] = useState<string | undefined>()
  const elapsed = useElapsed(openTrade?.openedAt)

  const unrealized =
    openTrade && price !== undefined ? paperTradingEngine.unrealizedPnl(openTrade, price) : 0

  function handleEnter() {
    if (!signal) return
    const result = onEnter(signal, riskPct)
    setError(result.ok ? undefined : result.reason)
  }

  return (
    <Panel
      title="Practice Arena — Paper Trade"
      action={
        <span className="rounded-sm border border-instrument/40 bg-instrument/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-instrument">
          VIRTUAL MONEY
        </span>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Readout label="Virtual Capital" value={formatUsd(balance)} sub={`Started at ${formatUsd(STARTING_CAPITAL)}`} />
        <Readout
          label="Equity (incl. open)"
          value={formatUsd(equity)}
          tone={equity >= balance ? 'default' : 'short'}
        />
        <Readout
          label="Return"
          value={formatPct(((balance - STARTING_CAPITAL) / STARTING_CAPITAL) * 100)}
          tone={balance >= STARTING_CAPITAL ? 'long' : 'short'}
        />
      </div>

      {openTrade ? (
        <div className="mt-5 border-t border-rule pt-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="label">Open Position — {LIVE_SYMBOL_LABEL}</p>
            <span className="tabular text-xs text-ink-dim">
              TRADE DURATION {formatDuration(elapsed)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Readout label="Direction" value={openTrade.direction} size="sm" />
            <Readout label="Entry Fill" value={formatUsd(openTrade.entryPrice)} size="sm" />
            <Readout label="Quantity" value={openTrade.quantity.toFixed(5)} size="sm" tone="dim" />
            <Readout
              label="Unrealized P/L"
              value={formatUsd(unrealized)}
              tone={unrealized >= 0 ? 'long' : 'short'}
              size="sm"
            />
            <Readout label="Target" value={formatUsd(openTrade.target)} tone="long" size="sm" />
            <Readout label="Invalidation" value={formatUsd(openTrade.invalidation)} tone="short" size="sm" />
            <Readout label="Risk at entry" value={formatPct(openTrade.riskPctAtEntry * 100, false)} size="sm" tone="dim" />
            <Readout label="Fees assumed" value={formatUsd(openTrade.feesPaid)} size="sm" tone="dim" />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={price === undefined}
            className="mt-5 w-full rounded-sm border border-rule-bright bg-panel-3 px-4 py-2.5 text-xs font-semibold tracking-[0.14em] text-ink transition-colors hover:border-ink-faint disabled:cursor-not-allowed disabled:opacity-40"
          >
            CLOSE POSITION AT MARKET
          </button>
          <p className="mt-2 text-[11px] text-ink-faint">
            Closing early is recorded as USER CLOSED and counted in your discipline review.
          </p>
        </div>
      ) : (
        <div className="mt-5 border-t border-rule pt-4">
          <p className="label mb-2">Risk per trade</p>
          <div className="flex flex-wrap gap-2">
            {RISK_CHOICES.map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setRiskPct(choice)}
                className={`tabular rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  riskPct === choice
                    ? 'border-instrument bg-instrument/15 text-instrument'
                    : 'border-rule-bright text-ink-dim hover:text-ink'
                }`}
              >
                {(choice * 100).toFixed(choice === 0.005 ? 1 : 0)}%
              </button>
            ))}
            <span className="self-center text-[11px] text-ink-faint">
              Training limit {(MAX_RISK_PCT * 100).toFixed(0)}% · risking{' '}
              {formatUsd(balance * riskPct)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleEnter}
            disabled={!canTrade || !signal}
            className="mt-4 w-full rounded-sm border border-long/50 bg-long/15 px-4 py-2.5 text-xs font-semibold tracking-[0.14em] text-long transition-colors hover:bg-long/25 disabled:cursor-not-allowed disabled:border-rule disabled:bg-panel-2 disabled:text-ink-faint"
          >
            {signal ? `OPEN PAPER ${signal.action}` : 'NO SETUP TO TRADE'}
          </button>

          {!canTrade && (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-hold">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              A paper trade needs a verified live price and a signal inside its validity window.
            </p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 flex items-start gap-1.5 rounded-sm border border-short/40 bg-short/10 p-2.5 text-[11px] text-short">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </Panel>
  )
}
