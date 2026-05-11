import type { AtsRole } from '../ats/keywordExtract'
import type { TailorPlan, TailorPlanV2 } from './planTypes'

const DEFAULT_PLAN: TailorPlan = {
  role: 'auto',
  keywordLimit: 25,
  mustIncludeExperienceIds: [],
  mustIncludeProjectIds: [],
  forceKeywords: [],
}

function parseCsvList(v: string): string[] {
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function isAtsRole(v: string): v is AtsRole {
  return [
    'auto',
    'software_eng',
    'data_eng',
    'data_science',
    'project_management',
    'data_analysis',
    'systems_eng',
    'industrial_eng',
  ].includes(v)
}

export function parseTailorPlan(
  text: string,
): { ok: true; plan: TailorPlan | TailorPlanV2 } | { ok: false; error: string } {
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Partial<TailorPlanV2>
      const role = (parsed.role ?? 'auto') as string
      if (!isAtsRole(role)) return { ok: false as const, error: `Unknown role: ${String(parsed.role)}` }
      const keywordLimit = Number(parsed.keywordLimit ?? 25)
      if (!Number.isFinite(keywordLimit) || keywordLimit < 10 || keywordLimit > 60) {
        return { ok: false as const, error: 'keywordLimit must be between 10 and 60.' }
      }
      const experienceIds = Array.isArray(parsed.experienceIds) ? parsed.experienceIds.filter((x): x is string => typeof x === 'string') : []
      const projectIds = Array.isArray(parsed.projectIds) ? parsed.projectIds.filter((x): x is string => typeof x === 'string') : []
      if (experienceIds.length === 0 || projectIds.length === 0) {
        return { ok: false as const, error: 'Plan JSON must include non-empty experienceIds and projectIds.' }
      }
      return {
        ok: true as const,
        plan: {
          role,
          keywordLimit: Math.trunc(keywordLimit),
          experienceIds,
          projectIds,
          experiencePatches: Array.isArray(parsed.experiencePatches) ? parsed.experiencePatches : undefined,
          projectPatches: Array.isArray(parsed.projectPatches) ? parsed.projectPatches : undefined,
          skillsGroups: Array.isArray(parsed.skillsGroups) ? parsed.skillsGroups : undefined,
          relevantCourses: Array.isArray(parsed.relevantCourses) ? parsed.relevantCourses : undefined,
        } satisfies TailorPlanV2,
      }
    } catch {
      return { ok: false as const, error: 'Invalid JSON in Tailor Plan.' }
    }
  }

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))

  const kv = new Map<string, string>()
  for (const line of lines) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim().toLowerCase()
    const value = line.slice(idx + 1).trim()
    kv.set(key, value)
  }

  const roleRaw = (kv.get('target_role') ?? kv.get('role') ?? DEFAULT_PLAN.role).toLowerCase()
  if (!isAtsRole(roleRaw)) return { ok: false as const, error: `Unknown role: ${roleRaw}` }

  const limitRaw = kv.get('keyword_limit') ?? String(DEFAULT_PLAN.keywordLimit)
  const limit = Number(limitRaw)
  if (!Number.isFinite(limit) || limit < 10 || limit > 60) {
    return {
      ok: false as const,
      error: `keyword_limit must be a number between 10 and 60 (got ${limitRaw})`,
    }
  }

  const mustExp = parseCsvList(kv.get('must_include_experience_ids') ?? '')
  const mustProj = parseCsvList(kv.get('must_include_project_ids') ?? '')
  const force = parseCsvList(kv.get('keywords_to_force') ?? kv.get('force_keywords') ?? '')

  return {
    ok: true as const,
    plan: {
      role: roleRaw,
      keywordLimit: Math.trunc(limit),
      mustIncludeExperienceIds: mustExp,
      mustIncludeProjectIds: mustProj,
      forceKeywords: force,
    },
  }
}

