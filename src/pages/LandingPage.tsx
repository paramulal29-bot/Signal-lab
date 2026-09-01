import { Link } from 'react-router-dom'
import { Activity, BookOpen, LineChart, ShieldAlert } from 'lucide-react'
import { Panel } from '../components/instrument/Panel'

const PILLARS = [
  {
    Icon: LineChart,
    title: 'Real market data',
    body: 'Signals are calculated on live public BTC/USDT candles. When the feed is unavailable, the interface says so instead of showing stale prices as current.',
  },
  {
    Icon: Activity,
    title: 'Explainable signals',
    body: 'A deterministic moving-average strategy — not an AI guessing the future. Every signal shows its reasoning, and identical candles always produce an identical signal.',
  },
  {
    Icon: BookOpen,
    title: 'Virtual capital',
    body: '$10,000 of practice money, priced against real market moves with assumed fees, spread and slippage charged against you. No deposits, no withdrawals, no real trading.',
  },
  {
    Icon: ShieldAlert,
    title: 'Transparent results',
    body: 'Every published signal is recorded with its timestamp and levels locked. Losses are shown exactly like wins. Nothing is deleted to improve the numbers.',
  },
]

export function LandingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <section className="border-b border-rule pb-12">
        <p className="label mb-4">Crypto trading practice platform</p>
        <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
          PRACTICE THE MARKET
          <br />
          BEFORE YOU RISK YOUR MONEY.
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink-dim">
          Real market data. Algorithmic signals. Virtual capital. Transparent results.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/academy"
            className="rounded-sm border border-long/50 bg-long/10 px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-long transition-colors hover:bg-long/20"
          >
            START TRAINING
          </Link>
          <Link
            to="/records"
            className="rounded-sm border border-rule-bright px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-ink-dim transition-colors hover:text-ink"
          >
            EXPLORE SIGNALS
          </Link>
        </div>

        <p className="mt-6 max-w-xl text-[11px] leading-relaxed text-ink-faint">
          SignalLab does not connect to any exchange, broker or wallet, cannot place real orders, and
          makes no claim that any strategy is profitable. It is a training simulator.
        </p>
      </section>

      <section className="grid gap-4 py-12 sm:grid-cols-2">
        {PILLARS.map(({ Icon, title, body }) => (
          <Panel key={title}>
            <Icon className="mb-3 h-5 w-5 text-instrument" aria-hidden />
            <h2 className="mb-2 text-sm font-semibold text-ink">{title}</h2>
            <p className="text-xs leading-relaxed text-ink-dim">{body}</p>
          </Panel>
        ))}
      </section>

      <section className="border-t border-rule py-10">
        <h2 className="label mb-4">How the training works</h2>
        <ol className="grid gap-3 text-xs text-ink-dim sm:grid-cols-3">
          {[
            ['01', 'Learn the basics', 'Short lessons covering candles, entries, invalidation and position sizing — then a knowledge check.'],
            ['02', 'Practice on live prices', 'Follow published signals with virtual capital and watch the real market resolve them.'],
            ['03', 'Measure your discipline', 'Scored on the rules you followed, not on how much virtual money you made.'],
          ].map(([num, title, body]) => (
            <li key={num} className="rounded-sm border border-rule bg-panel-1 p-4">
              <span className="tabular text-instrument">{num}</span>
              <p className="mt-2 text-sm font-semibold text-ink">{title}</p>
              <p className="mt-1.5 leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
