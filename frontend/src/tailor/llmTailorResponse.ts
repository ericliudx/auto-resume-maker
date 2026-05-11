import type { AtsRole } from '../ats/keywordExtract'
import { capRelevantCoursesList } from './relevantCoursesCap'
import type { TailorModelResult } from './tailorTypes'

const ATS_ROLES: AtsRole[] = [
  'auto',
  'software_eng',
  'data_eng',
  'data_science',
  'project_management',
  'data_analysis',
  'systems_eng',
  'industrial_eng',
]

function isAtsRole(v: unknown): v is AtsRole {
  return typeof v === 'string' && (ATS_ROLES as string[]).includes(v)
}

function uniqueStrings(xs: unknown): string[] {
  if (!Array.isArray(xs)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const v of xs) {
    if (typeof v !== 'string') continue
    const k = v.trim()
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(k)
  }
  return out
}

/** Split optional BIGGEST_GAPS section per `.specify/general-tailor-llm-prompt.txt`. */
export function splitBiggestGapsBlock(text: string): { jsonRegion: string; gapsText?: string } {
  const trimmed = text.trim()
  const parts = trimmed.split(/\n\s*BIGGEST_GAPS\s*:\s*/i)
  if (parts.length < 2) return { jsonRegion: trimmed }
  return { jsonRegion: parts[0]?.trim() ?? '', gapsText: parts.slice(1).join('\nBIGGEST_GAPS:').trim() }
}

/** Extract first top-level `{ ... }` from a region that may include leading/trailing prose. */
export function extractFirstJsonObject(region: string): { ok: true; jsonText: string } | { ok: false; error: string } {
  const s = region.trim()
  const start = s.indexOf('{')
  if (start === -1) return { ok: false, error: 'No JSON object found in model output.' }

  let depth = 0
  let inString: '"' | "'" | null = null
  let escape = false

  for (let i = start; i < s.length; i++) {
    const c = s[i]

    if (inString) {
      if (escape) {
        escape = false
        continue
      }
      if (c === '\\') {
        escape = true
        continue
      }
      if (c === inString) inString = null
      continue
    }

    if (c === '"' || c === "'") {
      inString = c as '"' | "'"
      continue
    }

    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return { ok: true, jsonText: s.slice(start, i + 1) }
    }
  }

  return { ok: false, error: 'JSON object appears truncated or unbalanced.' }
}

export type ParsedLlmTailorPlan = {
  model: TailorModelResult
  /** For syncing ATS controls after a successful tailor. */
  atsRole: AtsRole
  atsKeywordLimit: number
  gapsText?: string
}

function asPatchList(
  primary: unknown,
  fallback: unknown,
): Array<Record<string, unknown>> {
  const a = Array.isArray(primary) ? primary : null
  const b = Array.isArray(fallback) ? fallback : null
  const src = a?.length ? a : b
  if (!src) return []
  return src.filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
}

/**
 * Maps general-tailor JSON (patches + skillsGroups) and legacy tailor JSON (experiences/projects + skills)
 * into `TailorModelResult`.
 */
export function parseGeneralTailorPlanJson(
  raw: unknown,
): { ok: true; plan: Omit<ParsedLlmTailorPlan, 'gapsText'> } | { ok: false; error: string } {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'Model JSON was not an object.' }
  }
  const o = raw as Record<string, unknown>

  const experienceIds = uniqueStrings(o.experienceIds)
  const projectIds = uniqueStrings(o.projectIds)

  const expPatches = asPatchList(o.experiencePatches, o.experiences)
  const projPatches = asPatchList(o.projectPatches, o.projects)

  const experiences = expPatches
    .map((p) => {
      const id = typeof p.id === 'string' ? p.id : ''
      if (!id) return null
      return {
        id,
        bullets: Array.isArray(p.bullets) ? p.bullets.filter((x): x is string => typeof x === 'string') : undefined,
        title: typeof p.title === 'string' ? p.title : undefined,
        subtitle: typeof p.subtitle === 'string' ? p.subtitle : undefined,
        header: typeof p.header === 'string' ? p.header : undefined,
        tech: Array.isArray(p.tech) ? p.tech.filter((x): x is string => typeof x === 'string') : undefined,
      }
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))

  const projects = projPatches
    .map((p) => {
      const id = typeof p.id === 'string' ? p.id : ''
      if (!id) return null
      return {
        id,
        bullets: Array.isArray(p.bullets) ? p.bullets.filter((x): x is string => typeof x === 'string') : undefined,
        role: typeof p.role === 'string' ? p.role : undefined,
        descriptor: typeof p.descriptor === 'string' ? p.descriptor : undefined,
        header: typeof p.header === 'string' ? p.header : undefined,
        tech: Array.isArray(p.tech) ? p.tech.filter((x): x is string => typeof x === 'string') : undefined,
      }
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))

  let skills: TailorModelResult['skills']
  if (Array.isArray(o.skillsGroups) && o.skillsGroups.length) {
    const groups = o.skillsGroups
      .filter((g): g is { name: string; items: string[] } => {
        return (
          typeof g === 'object' &&
          g !== null &&
          typeof (g as { name?: unknown }).name === 'string' &&
          Array.isArray((g as { items?: unknown }).items)
        )
      })
      .map((g) => ({
        name: g.name,
        items: g.items.filter((x): x is string => typeof x === 'string'),
      }))
    if (groups.length) skills = { groups }
  } else if (
    typeof o.skills === 'object' &&
    o.skills !== null &&
    Array.isArray((o.skills as { groups?: unknown }).groups)
  ) {
    const groups = (o.skills as { groups: unknown[] }).groups
      .filter((g): g is { name: string; items: string[] } => {
        return (
          typeof g === 'object' &&
          g !== null &&
          typeof (g as { name?: unknown }).name === 'string' &&
          Array.isArray((g as { items?: unknown }).items)
        )
      })
      .map((g) => ({
        name: g.name,
        items: g.items.filter((x): x is string => typeof x === 'string'),
      }))
    if (groups.length) skills = { groups }
  }

  const pdfFileName = typeof o.pdfFileName === 'string' ? o.pdfFileName : undefined

  const relevantCourses = capRelevantCoursesList(
    Array.isArray(o.relevantCourses)
      ? o.relevantCourses.filter((x): x is string => typeof x === 'string')
      : undefined,
  )

  let atsRole: AtsRole = isAtsRole(o.role) ? o.role : 'software_eng'
  if (atsRole === 'auto') atsRole = 'software_eng'

  const kl = Number(o.keywordLimit ?? 25)
  const atsKeywordLimit =
    Number.isFinite(kl) && kl >= 10 && kl <= 60 ? Math.trunc(kl) : 25

  const plan: Omit<ParsedLlmTailorPlan, 'gapsText'> = {
    model: {
      experienceIds,
      projectIds,
      experiences,
      projects,
      skills,
      pdfFileName,
      ...(relevantCourses?.length ? { relevantCourses } : {}),
    },
    atsRole,
    atsKeywordLimit,
  }
  return { ok: true, plan }
}

export function parseLlmTailorResponseText(fullText: string):
  | { ok: true; plan: ParsedLlmTailorPlan }
  | { ok: false; error: string } {
  const { jsonRegion, gapsText } = splitBiggestGapsBlock(fullText)
  const extracted = extractFirstJsonObject(jsonRegion)
  if (!extracted.ok) return extracted

  let parsed: unknown
  try {
    parsed = JSON.parse(extracted.jsonText) as unknown
  } catch {
    return { ok: false, error: 'Model returned invalid JSON.' }
  }

  const parsedPlan = parseGeneralTailorPlanJson(parsed)
  if (parsedPlan.ok === false) return parsedPlan

  const p: ParsedLlmTailorPlan = { ...parsedPlan.plan, ...(gapsText ? { gapsText } : {}) }
  return { ok: true, plan: p }
}
