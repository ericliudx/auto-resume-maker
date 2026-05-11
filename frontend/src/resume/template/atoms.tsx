import type React from 'react'
import type { BioDateRange } from '../data/bioTypes'
import { formatBioDateRangeCompact, isNonEmptyString } from './templateUtils'

export function SectionTitle({ title }: { title: string }) {
  return (
    <div className="rt__sectionTitle" role="heading" aria-level={2}>
      {title}
    </div>
  )
}

export function BioDateLabels({ dates }: { dates: BioDateRange }) {
  const compact = formatBioDateRangeCompact(dates)
  if (!isNonEmptyString(compact)) return null
  return <div className="rt__itemDates">{compact}</div>
}

export function ContactLine({ children }: { children: React.ReactNode }) {
  return <div className="rt__contact">{children}</div>
}

