import type { BioDateRange, BioEducation } from '../data/bioTypes'

export function isNonEmptyString(x: unknown): x is string {
  return typeof x === 'string' && x.trim() !== ''
}

export function hasBioDates(d: BioDateRange | undefined): boolean {
  return Boolean(d?.start_date?.trim() || d?.end_date?.trim())
}

function formatMonthYear(s: string): string {
  const m = s.match(/^(\d{4})-(\d{2})$/)
  if (!m) return s
  const year = m[1]
  const mm = m[2]
  const monthNames: Record<string, string> = {
    '01': 'Jan',
    '02': 'Feb',
    '03': 'Mar',
    '04': 'Apr',
    '05': 'May',
    '06': 'Jun',
    '07': 'Jul',
    '08': 'Aug',
    '09': 'Sep',
    '10': 'Oct',
    '11': 'Nov',
    '12': 'Dec',
  }
  const mon = monthNames[mm]
  return mon ? `${mon} ${year}` : s
}

function formatDateToken(s: string): string {
  // Leave years ("2025") and already-formatted month words ("Jun 2024") alone.
  // Convert only strict YYYY-MM to "Mon YYYY".
  return formatMonthYear(s)
}

/** Single-line date range (for right-aligned dates). */
export function formatBioDateRangeCompact(d: BioDateRange | undefined): string {
  const sRaw = d?.start_date?.trim()
  const eRaw = d?.end_date?.trim()
  const s = sRaw ? formatDateToken(sRaw) : undefined
  const e = eRaw ? formatDateToken(eRaw) : undefined
  if (!s) return e ?? ''
  if (!e) return `${s} to present`
  return `${s} - ${e}`
}

export function parseHeaderPipe(header: string | undefined): { left?: string; right?: string } {
  if (!isNonEmptyString(header)) return {}
  const parts = header
    .split('|')
    .map((p) => p.trim())
    .filter((p) => p !== '')
  if (parts.length < 2) return { left: header }
  return { left: parts[0], right: parts.slice(1).join(' | ') }
}

export function formatEducationLine(entry: NonNullable<BioEducation['entries']>[number]): string {
  const degree = isNonEmptyString(entry.degree) ? entry.degree : ''
  const majors =
    Array.isArray(entry.majors) && entry.majors.length > 0 ? entry.majors.join(', ') : undefined
  const field = isNonEmptyString(entry.field) ? entry.field : undefined
  const gpa = typeof entry.gpa === 'number' ? `GPA: ${entry.gpa.toFixed(2)}` : undefined

  const focus = majors ?? field
  const parts = [degree, focus].filter((p): p is string => isNonEmptyString(p))
  const left = parts.join(', ')
  const right = gpa ? `(${gpa})` : ''
  return [left, right].filter((p) => p !== '').join(' ')
}

