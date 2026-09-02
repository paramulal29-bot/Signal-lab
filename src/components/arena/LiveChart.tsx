import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Candle, PublishedSignal } from '../../core/types'
import { formatUsd } from '../../utils/format'

interface LiveChartProps {
  candles: Candle[]
  signal: PublishedSignal | undefined
  /** Dimmed presentation when the feed is not currently LIVE. */
  muted?: boolean
}

interface CandleDatum {
  time: string
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  /** [low, high] — drives the wick bar. */
  wick: [number, number]
  /** [min(open,close), max(open,close)] — drives the body bar. */
  body: [number, number]
  rising: boolean
}

function toData(candles: Candle[]): CandleDatum[] {
  return candles.map((c) => ({
    time: c.time,
    timestamp: c.timestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    wick: [c.low, c.high],
    body: [Math.min(c.open, c.close), Math.max(c.open, c.close)],
    rising: c.close >= c.open,
  }))
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: CandleDatum }[] }) {
  if (!active || !payload?.length) return null
  const candle = payload[0].payload

  return (
    <div className="rounded-sm border border-rule-bright bg-panel-2 p-3 text-xs">
      <p className="label mb-1.5">{new Date(candle.timestamp).toUTCString().slice(5, 22)} UTC</p>
      <dl className="tabular grid grid-cols-2 gap-x-4 gap-y-0.5 text-ink-dim">
        <dt>O</dt>
        <dd className="text-right text-ink">{formatUsd(candle.open)}</dd>
        <dt>H</dt>
        <dd className="text-right text-ink">{formatUsd(candle.high)}</dd>
        <dt>L</dt>
        <dd className="text-right text-ink">{formatUsd(candle.low)}</dd>
        <dt>C</dt>
        <dd className={`text-right ${candle.rising ? 'text-long' : 'text-short'}`}>
          {formatUsd(candle.close)}
        </dd>
      </dl>
    </div>
  )
}

/**
 * Live BTC/USDT candlestick chart with the published signal's levels
 * drawn over it, so the trainee can watch the real market move relative
 * to what SignalLab said. Candles are LIVE MARKET; the dashed lines are
 * SIGNALLAB's levels — the legend states which is which.
 */
export function LiveChart({ candles, signal, muted = false }: LiveChartProps) {
  const data = toData(candles)
  const opacity = muted ? 0.45 : 1

  const prices = data.flatMap((d) => [d.high, d.low])
  const levels = signal
    ? [signal.entryZone.low, signal.entryZone.high, signal.target, signal.stopLoss].filter(
        (v): v is number => typeof v === 'number',
      )
    : []
  const all = [...prices, ...levels]
  const min = all.length ? Math.min(...all) : 0
  const max = all.length ? Math.max(...all) : 1
  const pad = (max - min) * 0.06 || 1

  return (
    <div>
      <div className="h-80 w-full" style={{ opacity }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-rule)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: 'var(--color-ink-faint)', fontSize: 10 }}
              interval={Math.max(Math.floor(data.length / 6), 0)}
              axisLine={{ stroke: 'var(--color-rule)' }}
              tickLine={false}
            />
            <YAxis
              domain={[min - pad, max + pad]}
              tick={{ fill: 'var(--color-ink-faint)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={78}
              tickFormatter={(v: number) => formatUsd(v)}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--color-rule-bright)' }} />

            {/* Wicks, then bodies — two stacked range bars per candle. */}
            <Bar dataKey="wick" barSize={1} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={`w-${d.timestamp}`} fill={d.rising ? 'var(--color-long)' : 'var(--color-short)'} />
              ))}
            </Bar>
            <Bar dataKey="body" barSize={5} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={`b-${d.timestamp}`} fill={d.rising ? 'var(--color-long)' : 'var(--color-short)'} />
              ))}
            </Bar>

            {signal && signal.action !== 'WAIT' && (
              <>
                {/* Labels are spread across left/right edges so they stay
                    legible when the levels sit close together. */}
                <ReferenceLine
                  y={signal.entryZone.high}
                  stroke="var(--color-instrument)"
                  strokeDasharray="4 3"
                  label={{
                    value: 'ENTRY',
                    position: 'insideTopRight',
                    fill: 'var(--color-instrument)',
                    fontSize: 9,
                  }}
                />
                <ReferenceLine y={signal.entryZone.low} stroke="var(--color-instrument)" strokeDasharray="4 3" />
                {signal.target !== undefined && (
                  <ReferenceLine
                    y={signal.target}
                    stroke="var(--color-long)"
                    strokeDasharray="6 3"
                    label={{ value: 'TARGET', position: 'insideTopLeft', fill: 'var(--color-long)', fontSize: 9 }}
                  />
                )}
                {signal.stopLoss !== undefined && (
                  <ReferenceLine
                    y={signal.stopLoss}
                    stroke="var(--color-short)"
                    strokeDasharray="6 3"
                    label={{
                      value: 'INVALIDATION',
                      position: 'insideBottomLeft',
                      fill: 'var(--color-short)',
                      fontSize: 9,
                    }}
                  />
                )}
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-1 bg-long" /> / <span className="h-2.5 w-1 bg-short" /> Live market candles
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-px w-4 border-t border-dashed border-instrument" /> SignalLab levels
        </span>
      </div>
    </div>
  )
}
