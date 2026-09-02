import { Link } from 'react-router-dom'
import { BarChart3, FlaskConical, GraduationCap, ScrollText, Zap } from 'lucide-react'

const DESTINATIONS = [
  {
    to: '/arena',
    Icon: Zap,
    title: 'PRACTICE NOW',
    detail: 'Live market, virtual capital',
    accent: 'text-long border-long/40 hover:border-long/70',
  },
  {
    to: '/academy',
    Icon: GraduationCap,
    title: 'ACADEMY',
    detail: 'Learn if you want to',
    accent: 'text-instrument border-instrument/40 hover:border-instrument/70',
  },
  {
    to: '/simulation',
    Icon: FlaskConical,
    title: 'SIMULATION LAB',
    detail: 'Explore on generated data',
    accent: 'text-ink-dim border-rule-bright hover:border-ink-faint',
  },
  {
    to: '/performance',
    Icon: BarChart3,
    title: 'PERFORMANCE',
    detail: 'Your recorded results',
    accent: 'text-ink-dim border-rule-bright hover:border-ink-faint',
  },
  {
    to: '/records',
    Icon: ScrollText,
    title: 'SIGNAL RECORD',
    detail: 'Every signal, immutable',
    accent: 'text-ink-dim border-rule-bright hover:border-ink-faint',
  },
]

export function QuickAccess() {
  return (
    <section>
      <h2 className="label mb-3">Quick access</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {DESTINATIONS.map(({ to, Icon, title, detail, accent }) => (
          <Link
            key={to}
            to={to}
            className={`btn group flex flex-col justify-between border bg-panel-1 p-4 hover:bg-panel-2 ${accent}`}
          >
            <Icon className="h-5 w-5" aria-hidden />
            <div className="mt-5">
              <p className="text-xs font-bold tracking-[0.12em]">{title}</p>
              <p className="mt-1 text-[11px] text-ink-faint">{detail}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
