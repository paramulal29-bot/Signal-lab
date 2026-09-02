import { NavLink, Link } from 'react-router-dom'
import { Activity, Zap } from 'lucide-react'

const NAV_LINKS = [
  { to: '/arena', label: 'PRACTICE' },
  { to: '/academy', label: 'ACADEMY' },
  { to: '/performance', label: 'PERFORMANCE' },
  { to: '/records', label: 'SIGNAL RECORD' },
  { to: '/simulation', label: 'SIMULATION LAB' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-panel-0/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center border border-rule-bright bg-panel-2">
            <Activity className="h-4 w-4 text-instrument" aria-hidden />
          </span>
          <span className="text-sm font-bold tracking-[0.16em] text-ink">SIGNALLAB</span>
          <span className="hidden rounded-sm border border-rule-bright px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.12em] text-ink-faint sm:inline">
            TRAINING
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-[10px] font-semibold tracking-[0.14em] transition-colors ${
                  isActive ? 'text-instrument' : 'text-ink-faint hover:text-ink'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <Link
          to="/arena"
          className="btn flex items-center gap-1.5 border border-long/50 bg-long/15 px-3.5 py-1.5 text-[10px] font-bold tracking-[0.14em] text-long hover:bg-long/25"
        >
          <Zap className="h-3 w-3" aria-hidden />
          PRACTICE NOW
        </Link>
      </div>

      <nav className="flex items-center gap-4 overflow-x-auto border-t border-rule px-4 py-2 lg:hidden">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `whitespace-nowrap text-[10px] font-semibold tracking-[0.12em] ${
                isActive ? 'text-instrument' : 'text-ink-faint'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
