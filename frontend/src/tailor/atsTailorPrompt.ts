import type { BioBank } from '../resume/data/bioTypes'
import { makeBankForPrompt } from './tailorBank'

export function buildAtsTailorPrompt(args: {
  jobText: string
  bank: BioBank
  missingKeywords: string[]
}): string {
  const jobText = args.jobText.trim()
  const missing = args.missingKeywords
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 12)

  return [
    'Return ONLY valid JSON. No markdown. No code fences.',
    '',
    'You are improving ATS keyword match for a resume using a fixed template.',
    'You MUST NOT fabricate employers, titles, degrees, dates, tools, or metrics.',
    'Only use keywords that are supported by the bank content. If a keyword is not supported, put it in `cannotAdd` with a reason.',
    '',
    'Hard requirements:',
    '- Select EXACTLY 3 experiences and EXACTLY 3 projects (experienceIds/projectIds length must be 3).',
    '- For EACH selected experience/project: return rewritten bullets (max 3 bullets each).',
    '- Try to incorporate as many of the provided missing keywords as truthfully possible.',
    '- Include a `keywordMap` entry for each keyword you successfully placed (where you placed it).',
    '',
    'Missing keywords to target (in priority order):',
    missing.length ? missing.join(', ') : '(none)',
    '',
    'Output JSON shape:',
    '{',
    '  "experienceIds": ["<id>", "<id>", "<id>"],',
    '  "projectIds": ["<id>", "<id>", "<id>"],',
    '  "experiences": [{"id":"<id>","bullets":["..."]}],',
    '  "projects": [{"id":"<id>","bullets":["..."]}],',
    '  "keywordMap": [{"keyword":"<k>","target":"experience|project","id":"<id>","bulletIndex":0}],',
    '  "cannotAdd": [{"keyword":"<k>","reason":"<why>"}]',
    '}',
    '',
    'Job posting:',
    jobText,
    '',
    'Bank JSON (slim):',
    JSON.stringify(makeBankForPrompt(args.bank)),
  ].join('\n')
}

