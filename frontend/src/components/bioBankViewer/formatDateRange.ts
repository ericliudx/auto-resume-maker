import type { BioDateRange } from '../../resume/data/bioTypes'

export function formatDateRange(d?: BioDateRange): string {
  if (!d) return ''
  const a = d.start_date?.trim()
  const b = d.end_date?.trim()
  if (a && b) return `${a} – ${b}`
  if (a) return `${a} – present`
  if (b) return b
  return ''
}
