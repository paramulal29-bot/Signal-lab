import { Activity } from 'lucide-react'

const NAV_LINKS = [
  { href: '#markets', label: 'Markets' },
  { href: '#signals', label: 'Signals' },
  { href: '#history', label: 'History' },
  { href: '#watchlist', label: 'Watchlist' },
  { href: '#pricing', label: 'Pricing' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-purple-500 to-blue-500">
            <Activity className="h-4.5 w-4.5 text-white" />
          </span>
          <span className="text-lg font-bold text-white">
            Signal<span className="text-purple-400">Lab</span>
          </span>
          <span className="hidden rounded-full border border-wait/40 bg-wait/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-wait sm:inline">
            Demo
          </span>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#pricing"
          className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
        >
          Go Pro
        </a>
      </div>

      <nav className="flex items-center gap-4 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="whitespace-nowrap text-xs font-medium text-gray-400 hover:text-white"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
