import type { BioBank } from '../resume/data/bioTypes'
import type { AtsKeyword } from './keywordExtract'

function norm(s: string): string {
  return s.toLowerCase()
}

function bankToText(bank: BioBank): string {
  const parts: string[] = []
  for (const e of bank.experiences) {
    parts.push(e.company ?? '', e.title ?? '', e.subtitle ?? '', e.header ?? '')
    if (Array.isArray(e.bullets)) parts.push(...e.bullets)
    if (Array.isArray(e.tech)) parts.push(...e.tech)
  }
  for (const p of bank.projects) {
    parts.push(p.name ?? '', p.role ?? '', p.descriptor ?? '', p.header ?? '')
    if (Array.isArray(p.bullets)) parts.push(...p.bullets)
    if (Array.isArray(p.tech)) parts.push(...p.tech)
  }
  for (const s of bank.skills) {
    for (const g of s.groups ?? []) {
      parts.push(g.name)
      parts.push(...g.items)
    }
  }
  return parts.filter(Boolean).join('\n')
}

export type AtsMatchReport = {
  score: number // 0..100
  covered: string[]
  missing: string[]
}

export function computeAtsMatchReport(args: { bank: BioBank; keywords: AtsKeyword[] }): AtsMatchReport {
  const haystack = norm(bankToText(args.bank))
  const covered: string[] = []
  const missing: string[] = []

  let totalWeight = 0
  let coveredWeight = 0

  for (const k of args.keywords) {
    const weight = k.weight ?? 1
    totalWeight += weight

    const variants = (k.variants ?? [k.term]).map((v) => norm(v))
    const ok = variants.some((v) => v && haystack.includes(v))
    if (ok) {
      covered.push(k.term)
      coveredWeight += weight
    } else {
      missing.push(k.term)
    }
  }

  const score = totalWeight <= 0 ? 0 : Math.round((coveredWeight / totalWeight) * 100)
  return { score, covered, missing }
}

