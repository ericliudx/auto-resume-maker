import type { ResumeContact } from './data/contact'
import type { TailorModelResult } from '../tailor/tailorTypes'
import { sanitizePdfFileNameForPlan } from '../tailor/pdfFileName'

/** Fallback when the tailor patch has no valid `pdfFileName` (browser often uses `<title>.pdf`). */
export function resumePdfFileBase(contact: ResumeContact): string {
  const raw = contact.name.trim()
  const placeholder = /^your name$/i.test(raw) || raw === ''
  if (placeholder) {
    return 'Resume'
  }
  const words = raw.split(/\s+/).filter((w) => w.length > 0)
  const slug = words
    .map((w) => w.normalize('NFKD').replace(/[\u0300-\u036f]/g, ''))
    .map((w) => w.replace(/[^a-zA-Z0-9]+/g, ''))
    .filter((w) => w.length > 0)
    .join('_')
  const base = (slug || 'Resume').slice(0, 72)
  return `${base}_Resume`
}

export function documentTitleForPrint(
  contact: ResumeContact,
  patch: TailorModelResult | null,
): string {
  const fromPlan = patch?.pdfFileName ? sanitizePdfFileNameForPlan(patch.pdfFileName) : undefined
  if (fromPlan) return fromPlan
  return resumePdfFileBase(contact)
}
