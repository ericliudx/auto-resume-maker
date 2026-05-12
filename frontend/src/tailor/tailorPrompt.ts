import type { BioBank } from '../resume/data/bioTypes'
import type { AtsRole } from '../ats/keywordExtract'
import { makeBankForPrompt } from './tailorBank'
import { buildAtsContextAppendix } from './atsContextForTailorPrompt'

// Repo-root spec consumed at build time (Vite `?raw`); documents the JSON + BIGGEST_GAPS contract.
import generalTailorInstructions from '../../../.specify/general-tailor-llm-prompt.txt?raw'

export function buildTailorPrompt(args: {
  jobText: string
  bank: BioBank
  /** Same Role + Keywords controls as the ATS panel; drives the deterministic appendix below. */
  atsRole: AtsRole
  atsKeywordLimit: number
}): string {
  const jobText = args.jobText.trim().slice(0, 12_000)
  const atsAppendix = buildAtsContextAppendix({
    jobText,
    bank: args.bank,
    atsRole: args.atsRole,
    keywordLimit: args.atsKeywordLimit,
  })
  return [
    generalTailorInstructions.trim(),
    '',
    '## Aggregated bank JSON (from bio/experiences, bio/projects, bio/skills, bio/education on disk)',
    'Use only facts that appear in this bank.',
    '',
    JSON.stringify(makeBankForPrompt(args.bank)),
    '',
    '## Job posting (user-provided)',
    '',
    jobText,
    '',
    atsAppendix,
  ].join('\n')
}
