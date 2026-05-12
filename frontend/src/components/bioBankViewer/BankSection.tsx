import type { ReactNode } from 'react'
import { sectionTitleClass } from './uiClasses'

export function BankSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="min-w-0">
      <h2 className={sectionTitleClass()}>{title}</h2>
      {description ? (
        <p className="m-0 mb-2 text-[11px] leading-snug text-[color-mix(in_srgb,var(--text-h)_48%,transparent)]">
          {description}
        </p>
      ) : null}
      <div className="flex min-w-0 flex-col gap-2">{children}</div>
    </section>
  )
}
