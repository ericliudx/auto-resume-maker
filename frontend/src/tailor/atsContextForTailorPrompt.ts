import type { BioBank } from '../resume/data/bioTypes'
import { detectAtsRole, extractAtsKeywords, type AtsRole } from '../ats/keywordExtract'
import { computeAtsMatchReport } from '../ats/match'

/**
 * Deterministic ATS context (same extraction + scoring as the ATS panel), embedded in the
 * main tailor LLM user message so one call can close posting gaps truthfully.
 */
export function buildAtsContextAppendix(args: {
  jobText: string
  bank: BioBank
  atsRole: AtsRole
  keywordLimit: number
}): string {
  const jobText = args.jobText.trim().slice(0, 12_000)
  const detected = args.atsRole === 'auto' ? detectAtsRole(jobText) : null
  const keywords = extractAtsKeywords(jobText, {
    role: args.atsRole,
    limit: args.keywordLimit,
  })
  const rep = computeAtsMatchReport({ bank: args.bank, keywords })
  const terms = keywords.map((k) => k.term)
  const missingTop = rep.missing.slice(0, 25)
  const coveredSample = rep.covered.slice(0, 24)

  const lines = [
    '## Local ATS keyword pre-read (deterministic)',
    'Computed in the app from the job posting and the bio bank JSON above (not inferred by you).',
    'Prefer weaving missing terms into bullets and the technical skills row only when they are truthful for the bank. Never invent employers, titles, dates, or tools.',
    '',
    `- ATS controls used: role=${args.atsRole}, keywordLimit=${args.keywordLimit}`,
    detected
      ? `- Auto-detected role: ${detected.role} (confidence ${Math.round(detected.confidence * 100)}%)`
      : null,
    `- Weighted match score vs bank text: ${rep.score}/100`,
    `- Extracted keyword terms considered (${terms.length}): ${terms.join(', ')}`,
    `- Missing from bank (highest priority to cover when supported): ${
        missingTop.length ? missingTop.join(', ') : '(none)'
      }`,
    `- Sample terms already present in bank: ${
        coveredSample.length ? coveredSample.join(', ') : '(none)'
      }`,
  ]
  return lines.filter((x): x is string => x != null && x !== '').join('\n')
}
