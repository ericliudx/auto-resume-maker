import type React from 'react'

export function Panel({
  title,
  hint,
  right,
  children,
  ariaLabel,
}: {
  title: string
  hint?: React.ReactNode
  right?: React.ReactNode
  children: React.ReactNode
  ariaLabel: string
}) {
  return (
    <section className="flex flex-col min-h-0 min-w-0" aria-label={ariaLabel}>
      <div className="px-4 pt-3.5 pb-2.5 border-b border-[var(--border)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[14px] tracking-[-0.2px] text-[var(--text-h)] m-0">
              {title}
            </h2>
            {hint ? <div className="text-xs text-[var(--text)] mt-1">{hint}</div> : null}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
      </div>
      {children}
    </section>
  )
}

export function PanelBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={['min-h-0 min-w-0 flex-1', className ?? ''].join(' ')}>{children}</div>
}

