const STOPWORDS = new Set(
  [
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'for',
    'from',
    'have',
    'in',
    'is',
    'it',
    'of',
    'on',
    'or',
    'our',
    'that',
    'the',
    'their',
    'this',
    'to',
    'we',
    'with',
    'you',
    'your',
  ].map((s) => s.toLowerCase()),
)

function norm(s: string): string {
  return s.trim().toLowerCase()
}

function uniq(xs: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const x of xs) {
    const k = norm(x)
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(x.trim())
  }
  return out
}

// Small curated list to catch common ATS terms even if casing/punctuation varies.
const CANONICAL_TERMS: Array<{ key: string; variants: string[]; weight: number }> = [
  { key: 'react', variants: ['react', 'react.js', 'reactjs'], weight: 5 },
  { key: 'typescript', variants: ['typescript', 'ts'], weight: 5 },
  { key: 'javascript', variants: ['javascript', 'js'], weight: 4 },
  { key: 'node', variants: ['node', 'node.js', 'nodejs'], weight: 4 },
  { key: 'python', variants: ['python'], weight: 4 },
  { key: 'java', variants: ['java'], weight: 3 },
  { key: 'c++', variants: ['c++'], weight: 3 },
  { key: 'sql', variants: ['sql'], weight: 5 },
  { key: 'postgresql', variants: ['postgres', 'postgresql'], weight: 4 },
  { key: 'mysql', variants: ['mysql'], weight: 3 },
  { key: 'mongodb', variants: ['mongodb', 'mongo'], weight: 3 },
  { key: 'redis', variants: ['redis'], weight: 3 },
  { key: 'aws', variants: ['aws', 'amazon web services'], weight: 4 },
  { key: 'gcp', variants: ['gcp', 'google cloud'], weight: 3 },
  { key: 'azure', variants: ['azure'], weight: 3 },
  { key: 'docker', variants: ['docker'], weight: 4 },
  { key: 'kubernetes', variants: ['kubernetes', 'k8s'], weight: 4 },
  { key: 'ci/cd', variants: ['ci/cd', 'cicd', 'continuous integration', 'continuous delivery'], weight: 3 },
  { key: 'git', variants: ['git'], weight: 3 },
  { key: 'rest', variants: ['rest', 'restful'], weight: 3 },
  { key: 'graphql', variants: ['graphql'], weight: 3 },
  { key: 'microservices', variants: ['microservices', 'microservice'], weight: 2 },
  { key: 'testing', variants: ['unit tests', 'integration tests', 'testing', 'jest', 'vitest', 'pytest'], weight: 2 },
  { key: 'agile', variants: ['agile', 'scrum', 'kanban'], weight: 1 },
]

export type AtsKeyword = {
  term: string
  weight: number
  // optional set of variants we consider equivalent when matching
  variants?: string[]
}

export type AtsRole =
  | 'auto'
  | 'software_eng'
  | 'data_eng'
  | 'data_science'
  | 'project_management'
  | 'data_analysis'
  | 'systems_eng'
  | 'industrial_eng'

const ROLE_SEEDS: Record<Exclude<AtsRole, 'auto'>, string[]> = {
  software_eng: ['react', 'typescript', 'node', 'rest', 'testing', 'ci/cd', 'docker', 'kubernetes', 'aws'],
  data_eng: ['sql', 'python', 'etl', 'elt', 'airflow', 'spark', 'dbt', 'data modeling', 'warehouse'],
  data_science: ['python', 'pandas', 'scikit-learn', 'statistics', 'experimentation', 'a/b testing', 'modeling'],
  project_management: ['stakeholders', 'roadmap', 'requirements', 'scope', 'risk', 'delivery', 'agile', 'scrum'],
  data_analysis: ['sql', 'dashboards', 'tableau', 'power bi', 'excel', 'metrics', 'insights'],
  systems_eng: ['linux', 'networking', 'reliability', 'observability', 'automation', 'incident response'],
  industrial_eng: ['process improvement', 'lean', 'six sigma', 'optimization', 'simulation', 'root cause'],
}

function titleSlice(jobText: string): string {
  // Use the first couple lines as a "title/header" hint (common in postings).
  return jobText.split('\n').slice(0, 3).join('\n').toLowerCase()
}

export function detectAtsRole(jobText: string): { role: Exclude<AtsRole, 'auto'>; confidence: number } {
  const title = titleSlice(jobText)
  const full = jobText.toLowerCase()

  const roles = Object.keys(ROLE_SEEDS) as Array<Exclude<AtsRole, 'auto'>>
  const scores = roles.map((r) => {
    let s = 0
    // Title mentions get a strong boost.
    if (r === 'data_eng' && /data\s+engineer|etl|elt|pipeline/.test(title)) s += 8
    if (r === 'data_science' && /data\s+scientist|machine\s+learning|ml\b/.test(title)) s += 8
    if (r === 'data_analysis' && /data\s+analyst|analytics/.test(title)) s += 8
    if (r === 'project_management' && /project\s+manager|program\s+manager|product\s+manager|pm\b/.test(title))
      s += 8
    if (r === 'systems_eng' && /systems?\s+engineer|sre|devops|platform/.test(title)) s += 8
    if (r === 'industrial_eng' && /industrial\s+engineer|process|operations/.test(title)) s += 8
    if (r === 'software_eng' && /software\s+engineer|full[-\s]?stack|frontend|backend/.test(title)) s += 8

    // Seed-term presence in the full body.
    for (const term of ROLE_SEEDS[r]) {
      if (full.includes(term.toLowerCase())) s += 1
    }
    return { role: r, score: s }
  })

  scores.sort((a, b) => b.score - a.score)
  const best = scores[0] ?? { role: 'software_eng' as const, score: 0 }
  const second = scores[1]?.score ?? 0
  const confidence = best.score <= 0 ? 0 : Math.max(0, Math.min(1, (best.score - second) / Math.max(6, best.score)))
  return { role: best.role, confidence }
}

export function extractAtsKeywords(
  jobText: string,
  opts?: { limit?: number; role?: AtsRole },
): AtsKeyword[] {
  const limit = opts?.limit ?? 25
  const text = jobText.toLowerCase()

  const foundCanonical: AtsKeyword[] = []
  for (const t of CANONICAL_TERMS) {
    if (t.variants.some((v) => text.includes(v.toLowerCase()))) {
      foundCanonical.push({ term: t.key, weight: t.weight, variants: t.variants })
    }
  }

  // Heuristic phrase extraction:
  // - grab sequences of letters/numbers/+/.- up to 4 tokens
  // - keep those that look like skills/tools (contain a digit, '+', '.', or are TitleCase-ish originally)
  const rawTokens = jobText
    .replace(/[(){}[\],]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)

  const candidateSingles: string[] = []
  for (const tok of rawTokens) {
    const clean = tok.replace(/^[^a-zA-Z0-9+]+|[^a-zA-Z0-9+.-]+$/g, '')
    if (!clean) continue
    const k = norm(clean)
    if (k.length < 2) continue
    if (STOPWORDS.has(k)) continue
    if (/^\d+$/.test(k)) continue
    // prefer tokens that look like technologies/acronyms
    if (/[+.]/.test(clean) || /\d/.test(clean) || clean.toUpperCase() === clean) candidateSingles.push(clean)
  }

  const freq = new Map<string, number>()
  for (const s of candidateSingles) {
    const k = norm(s)
    freq.set(k, (freq.get(k) ?? 0) + 1)
  }

  const rankedSingles = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60)
    .map(([k, c]) => ({ term: k, weight: Math.min(3, 1 + c / 2) }))

  const merged: AtsKeyword[] = [
    ...foundCanonical,
    ...rankedSingles.filter((s) => !foundCanonical.some((c) => norm(c.term) === norm(s.term))),
  ]

  const detected = opts?.role === 'auto' ? detectAtsRole(jobText).role : null
  const role = opts?.role === 'auto' ? detected : opts?.role
  const seeded = role ? ROLE_SEEDS[role] : []

  const allTerms = uniq([
    ...seeded,
    ...merged.map((k) => k.term),
  ])

  const scored = allTerms.map((t) => {
    const canonical = foundCanonical.find((c) => norm(c.term) === norm(t))
    const baseWeight = canonical?.weight ?? 1
    const seedBoost = seeded.some((s) => norm(s) === norm(t)) ? 2 : 0
    return canonical
      ? { ...canonical, weight: baseWeight + seedBoost }
      : { term: t, weight: 1 + seedBoost }
  })

  // Prefer higher weight terms first.
  scored.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
  return scored.slice(0, limit)
}

