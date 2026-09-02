import type { PropsWithChildren, ReactNode } from 'react'

interface PanelProps extends PropsWithChildren {
  /** Small technical label rendered on the panel bezel. */
  title?: string
  /** Optional right-aligned content in the title bar. */
  action?: ReactNode
  className?: string
  id?: string
}

/**
 * The base instrument panel. Square-ish corners, hairline rule, matte
 * surface — the housing every readout sits in.
 */
export function Panel({ title, action, children, className = '', id }: PanelProps) {
  return (
    <section id={id} className={`rounded-sm border border-rule bg-panel-1 ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
          {title && <h2 className="label">{title}</h2>}
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}
