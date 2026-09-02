import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { calculatePaperPerformance, equityCurve } from '../core/performance/PaperPerformance'
import { STARTING_CAPITAL } from '../core/paper/rules'
import { formatDuration } from '../hooks/useCountdown'
import { useArena } from '../hooks/useArena'
import { formatPct, formatUsd } from '../utils/format'
import { OutcomeTag } from '../components/common/OutcomeTag'
import { DisciplinePanel } from '../components/discipline/DisciplinePanel'
import { Panel } from '../components/instrument/Panel'
import { Readout } from '../components/instrument/Readout'

export function PerformancePage() {
  const { trades, openTrade, discipline, snapshot } = useArena()
  const stats = calculatePaperPerformance(trades)
  const curve = equityCurve(trades)
  const closed = trades.filter((t) => t.status === 'CLOSED')

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <Panel title="Live paper trading — performance">
        <p className="mb-4 text-[11px] leading-relaxed text-ink-faint">
          These numbers come only from paper trades you actually placed, computed from recorded
          outcomes. They describe simulated practice with virtual money on {snapshot.dataMode === 'LIVE' ? 'live' : 'simulated'} prices
          — not real trading, and not a projection of future results. Losing trades are included.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Readout label="Paper trades" value={String(stats.totalTrades)} size="sm" />
          <Readout label="Win rate" value={formatPct(stats.winRatePct, false)} size="sm" tone={stats.winRatePct >= 50 ? 'long' : 'short'} />
          <Readout label="Average win" value={formatUsd(stats.avgWinUsd)} tone="long" size="sm" />
          <Readout label="Average loss" value={formatUsd(stats.avgLossUsd)} tone="short" size="sm" />
          <Readout
            label="Profit factor"
            value={stats.profitFactor === undefined ? '—' : stats.profitFactor.toFixed(2)}
            size="sm"
          />
          <Readout label="Max drawdown" value={`-${stats.maxDrawdownPct.toFixed(2)}%`} tone="short" size="sm" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-rule pt-4 sm:grid-cols-3 lg:grid-cols-6">
          <Readout label="Wins" value={String(stats.wins)} tone="long" size="sm" />
          <Readout label="Losses" value={String(stats.losses)} tone="short" size="sm" />
          <Readout label="Open" value={String(stats.openTrades)} tone="dim" size="sm" />
          <Readout label="Avg duration" value={formatDuration(stats.avgDurationMs)} tone="dim" size="sm" />
          <Readout label="Virtual balance" value={formatUsd(stats.currentBalance)} size="sm" />
          <Readout
            label="Virtual return"
            value={formatPct(stats.virtualReturnPct)}
            tone={stats.virtualReturnPct >= 0 ? 'long' : 'short'}
            size="sm"
          />
        </div>

        {stats.excludedLateEntries > 0 && (
          <p className="mt-4 rounded-sm border border-hold/40 bg-hold/10 p-2.5 text-[11px] text-hold">
            {stats.excludedLateEntries} trade{stats.excludedLateEntries === 1 ? '' : 's'} entered after
            signal expiry {stats.excludedLateEntries === 1 ? 'is' : 'are'} counted in your virtual
            balance but excluded from the strategy win/loss statistics above.
          </p>
        )}
      </Panel>

      <Panel title="Virtual equity curve">
        {curve.length <= 1 ? (
          <p className="py-12 text-center text-xs text-ink-dim">
            No closed paper trades yet. This curve is drawn only from recorded outcomes — it stays
            empty until you have actually traded.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curve} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-rule)" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="index"
                  tick={{ fill: 'var(--color-ink-faint)', fontSize: 10 }}
                  axisLine={{ stroke: 'var(--color-rule)' }}
                  tickLine={false}
                  label={{ value: 'TRADE #', position: 'insideBottom', offset: -2, fill: 'var(--color-ink-faint)', fontSize: 9 }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: 'var(--color-ink-faint)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={78}
                  tickFormatter={(v: number) => formatUsd(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-panel-2)',
                    border: '1px solid var(--color-rule-bright)',
                    borderRadius: 2,
                    fontSize: 12,
                  }}
                  formatter={(value) => [formatUsd(Number(value)), 'Virtual equity']}
                />
                <ReferenceLine
                  y={STARTING_CAPITAL}
                  stroke="var(--color-rule-bright)"
                  strokeDasharray="4 3"
                  label={{ value: 'START', position: 'insideTopRight', fill: 'var(--color-ink-faint)', fontSize: 9 }}
                />
                <Area
                  type="stepAfter"
                  dataKey="equity"
                  stroke="var(--color-instrument)"
                  fill="var(--color-instrument)"
                  fillOpacity={0.12}
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      {openTrade && (
        <Panel title="Current open trade">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Readout label="Direction" value={openTrade.direction} size="sm" />
            <Readout label="Entry" value={formatUsd(openTrade.entryPrice)} size="sm" />
            <Readout label="Target" value={formatUsd(openTrade.target)} tone="long" size="sm" />
            <Readout label="Invalidation" value={formatUsd(openTrade.invalidation)} tone="short" size="sm" />
          </div>
        </Panel>
      )}

      <Panel title="Closed paper trades">
        {closed.length === 0 ? (
          <p className="py-8 text-center text-xs text-ink-dim">No closed paper trades yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-left text-xs">
              <thead>
                <tr className="label border-b border-rule">
                  <th className="py-2 pr-3 font-medium">Opened (UTC)</th>
                  <th className="py-2 pr-3 font-medium">Dir</th>
                  <th className="py-2 pr-3 font-medium">Entry</th>
                  <th className="py-2 pr-3 font-medium">Exit</th>
                  <th className="py-2 pr-3 font-medium">P/L</th>
                  <th className="py-2 pr-3 font-medium">Risk</th>
                  <th className="py-2 pr-3 font-medium">Outcome</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {closed.map((trade) => (
                  <tr key={trade.id} className="border-b border-rule/60 last:border-0">
                    <td className="py-2 pr-3 text-ink-dim">
                      {new Date(trade.openedAt).toISOString().slice(5, 16).replace('T', ' ')}
                    </td>
                    <td className="py-2 pr-3 text-ink">{trade.direction}</td>
                    <td className="py-2 pr-3 text-ink-dim">{formatUsd(trade.entryPrice)}</td>
                    <td className="py-2 pr-3 text-ink-dim">
                      {trade.exitPrice ? formatUsd(trade.exitPrice) : '—'}
                    </td>
                    <td className={`py-2 pr-3 ${(trade.realizedPnl ?? 0) >= 0 ? 'text-long' : 'text-short'}`}>
                      {formatUsd(trade.realizedPnl ?? 0)}
                    </td>
                    <td className="py-2 pr-3 text-ink-dim">{formatPct(trade.riskPctAtEntry * 100, false)}</td>
                    <td className="py-2 pr-3">
                      <OutcomeTag outcome={trade.outcome} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <DisciplinePanel discipline={discipline} />
    </div>
  )
}
