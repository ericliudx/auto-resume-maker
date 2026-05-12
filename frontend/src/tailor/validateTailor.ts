import type { BioBank } from '../resume/data/bioTypes'
import type { TailorModelResult } from './tailorTypes'
import { sanitizePdfFileNameForPlan } from './pdfFileName'
import { capRelevantCoursesList } from './relevantCoursesCap'
import { sanitizeResumeTypography } from './resumeTypography'

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

export function validateTailorResult(args: {
  base: BioBank
  result: TailorModelResult
  mode?: 'default' | 'ats'
}):
  | { ok: true; normalized: TailorModelResult }
  | { ok: false; message: string } {
  const { base, result } = args
  const mode = args.mode ?? 'default'

  const expIds = uniqueStrings(result.experienceIds)
  const projIds = uniqueStrings(result.projectIds)

  if (expIds.length === 0) return { ok: false, message: 'Model returned empty experienceIds.' }
  if (projIds.length === 0) return { ok: false, message: 'Model returned empty projectIds.' }

  const expSet = new Set(base.experiences.map((e) => e.id))
  const projSet = new Set(base.projects.map((p) => p.id))

  const badExp = expIds.filter((id) => !expSet.has(id))
  const badProj = projIds.filter((id) => !projSet.has(id))
  if (badExp.length) return { ok: false, message: `Model used unknown experienceIds: ${badExp.join(', ')}` }
  if (badProj.length) return { ok: false, message: `Model used unknown projectIds: ${badProj.join(', ')}` }

  const MAX_IDS = 12
  const { pdfFileName: pdfRaw, relevantCourses: rcIn, ...resultRest } = result
  const pdfSanitized = sanitizePdfFileNameForPlan(pdfRaw)
  if (mode === 'default' && !pdfSanitized) {
    return {
      ok: false,
      message:
        'Model must return a valid top-level pdfFileName (First_Last_Company: at least three ASCII segments separated by underscores, e.g. Eric_Liu_Affirm).',
    }
  }
  const relevantCoursesRaw = uniqueStrings(rcIn).map((c) => sanitizeResumeTypography(c))
  const relevantCourses = capRelevantCoursesList(relevantCoursesRaw) ?? []
  const normalized: TailorModelResult = {
    ...resultRest,
    experienceIds: expIds.slice(0, MAX_IDS),
    projectIds: projIds.slice(0, MAX_IDS),
    ...(pdfSanitized ? { pdfFileName: pdfSanitized } : {}),
    ...(relevantCourses.length ? { relevantCourses } : {}),
  }

  const expPatchIds = new Set((normalized.experiences ?? []).map((e) => e.id))
  const projPatchIds = new Set((normalized.projects ?? []).map((p) => p.id))
  if (expPatchIds.size === 0 && projPatchIds.size === 0) {
    return { ok: false, message: 'Model returned no experience/project patches (nothing to apply).' }
  }

  if (mode === 'ats') {
    const hasKeywordMap = Array.isArray(result.keywordMap) && result.keywordMap.length > 0
    const hasCannotAdd = Array.isArray(result.cannotAdd) && result.cannotAdd.length > 0
    if (!hasKeywordMap && !hasCannotAdd) {
      return { ok: false, message: 'ATS-tailor returned neither keywordMap nor cannotAdd.' }
    }
  }

  return { ok: true, normalized }
}

