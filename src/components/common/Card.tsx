import type { PropsWithChildren } from 'react'

interface CardProps extends PropsWithChildren {
  className?: string
  id?: string
}

/** Shared surface style for every panel on the dashboard. */
export function Card({ children, className = '', id }: CardProps) {
  return (
    <div
      id={id}
      className={`rounded-xl border border-border bg-surface p-5 shadow-lg shadow-black/20 ${className}`}
    >
      {children}
    </div>
  )
}
