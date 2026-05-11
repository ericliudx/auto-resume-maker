import type { BioBank } from '../resume/data/bioTypes'
import { makeBankForPrompt } from './tailorBank'

export function buildTailorPrompt(args: { jobText: string; bank: BioBank }): string {
  const jobText = args.jobText.trim()
  return [
    'Return ONLY valid JSON. No markdown. No code fences.',
    '',
    'You are tailoring a resume using a fixed template. You MUST NOT fabricate employers, titles, degrees, dates, or metrics.',
    'You may only rephrase and reorder content that already exists in the provided bank.',
    '',
    'Hard requirements:',
    '- Provide non-empty experienceIds and projectIds.',
    '- Only use IDs that exist in the bank.',
    '- Return updated bullets for at least 1 selected experience OR 1 selected project.',
    '',
    'Task:',
    '- Select and order the most relevant experiences and projects for the job.',
    '- Rewrite bullets to better match the job using truthful keywords (keep them concise).',
    '',
    'Output JSON shape:',
    '{',
    '  "experienceIds": ["<id>", "..."],',
    '  "projectIds": ["<id>", "..."],',
    '  "experiences": [{"id":"<id>","bullets":["..."],"title":"...","subtitle":"...","header":"...","tech":["..."]}],',
    '  "projects": [{"id":"<id>","bullets":["..."],"role":"...","descriptor":"...","header":"...","tech":["..."]}],',
    '  "skills": {"groups":[{"name":"...","items":["..."]}]}',
    '}',
    '',
    'Job posting:',
    jobText,
    '',
    'Bank JSON (slim):',
    JSON.stringify(makeBankForPrompt(args.bank)),
  ].join('\n')
}

