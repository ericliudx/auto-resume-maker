/**
 * `First_Last_Company`-style print/PDF basename: at least three underscore-separated
 * segments, ASCII letters/digits only (after normalization).
 */
export function sanitizePdfFileNameForPlan(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const collapsed = raw
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_]+/g, '')
  const compact = collapsed.replace(/_+/g, '_').replace(/^_|_$/g, '')
  const parts = compact.split('_').filter(Boolean)
  if (parts.length < 3 || compact.length < 5 || compact.length > 80) return undefined
  if (!/^[A-Za-z0-9]+(?:_[A-Za-z0-9]+){2,}$/.test(compact)) return undefined
  return compact
}
