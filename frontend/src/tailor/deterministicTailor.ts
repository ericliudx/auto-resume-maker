import type { BioBank, BioExperience, BioProject } from '../resume/data/bioTypes'
import { extractAtsKeywords } from '../ats/keywordExtract'
import type { TailorModelResult } from './tailorTypes'
import type { TailorPlan, TailorPlanV2 } from './planTypes'
import { capRelevantCoursesList } from './relevantCoursesCap'
import { sanitizePdfFileNameForPlan } from './pdfFileName'
import {
  MAX_TAILOR_EXPERIENCES,
  MAX_TAILOR_PROJECTS,
} from './tailorSelectionCap'
import { capExperiencePatchBulletsOrdered, capProjectPatchBullets } from './tailorPatchBulletCaps'

function norm(s: string): string {
  return s.toLowerCase()
}

function joinParts(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join('\n')
}

function experienceText(e: BioExperience): string {
  return joinParts([e.company, e.name, e.title, e.subtitle, e.header, ...(e.bullets ?? []), ...(e.tech ?? [])])
}

function projectText(p: BioProject): string {
  return joinParts([p.name, p.role, p.descriptor, p.header, ...(p.bullets ?? []), ...(p.tech ?? [])])
}

function scoreText(text: string, keywords: string[]): number {
  const hay = norm(text)
  let s = 0
  for (const k of keywords) {
    const kk = norm(k)
    if (!kk) continue
    if (hay.includes(kk)) s += 1
  }
  return s
}

function pickTopIds(args: {
  ids: string[]
  scores: Map<string, number>
  mustInclude: string[]
  limit: number
}): string[] {
  const out: string[] = []
  const seen = new Set<string>()

  for (const id of args.mustInclude) {
    if (!args.ids.includes(id)) continue
    if (seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }

  const remaining = args.ids
    .filter((id) => !seen.has(id))
    .map((id) => ({ id, s: args.scores.get(id) ?? 0 }))
    .sort((a, b) => b.s - a.s)

  for (const r of remaining) {
    if (out.length >= args.limit) break
    out.push(r.id)
  }

  return out.slice(0, args.limit)
}

export function generateDeterministicTailorPatch(args: {
  bank: BioBank
  jobText: string
  plan: TailorPlan | TailorPlanV2
}): TailorModelResult {
  // V2: explicit selection + patches.
  if ('experienceIds' in args.plan && 'projectIds' in args.plan) {
    const plan = args.plan as TailorPlanV2
    const pdfFileName = sanitizePdfFileNameForPlan(plan.pdfFileName)
    const rc =
      Array.isArray(plan.relevantCourses) && plan.relevantCourses.length
        ? capRelevantCoursesList(plan.relevantCourses.filter((c): c is string => typeof c === 'string'))
        : undefined
    const expIdsSliced = plan.experienceIds.slice(0, MAX_TAILOR_EXPERIENCES)
    return {
      experienceIds: plan.experienceIds,
      projectIds: plan.projectIds,
      experiences: capExperiencePatchBulletsOrdered(plan.experiencePatches, expIdsSliced),
      projects: capProjectPatchBullets(plan.projectPatches),
      skills: plan.skillsGroups ? { groups: plan.skillsGroups } : undefined,
      ...(pdfFileName ? { pdfFileName } : {}),
      ...(rc?.length ? { relevantCourses: rc } : {}),
    }
  }

  const extracted = extractAtsKeywords(args.jobText, { role: args.plan.role, limit: args.plan.keywordLimit })
  const keywords = Array.from(
    new Set([...extracted.map((k) => k.term), ...args.plan.forceKeywords].map((s) => s.trim()).filter(Boolean)),
  )

  const expScores = new Map<string, number>()
  for (const e of args.bank.experiences) {
    expScores.set(e.id, scoreText(experienceText(e), keywords))
  }

  const projScores = new Map<string, number>()
  for (const p of args.bank.projects) {
    projScores.set(p.id, scoreText(projectText(p), keywords))
  }

  const experienceIds = pickTopIds({
    ids: args.bank.experiences.map((e) => e.id),
    scores: expScores,
    mustInclude: args.plan.mustIncludeExperienceIds,
    limit: Math.min(Math.max(args.bank.experiences.length, 1), MAX_TAILOR_EXPERIENCES),
  })

  const projectIds = pickTopIds({
    ids: args.bank.projects.map((p) => p.id),
    scores: projScores,
    mustInclude: args.plan.mustIncludeProjectIds,
    limit: Math.min(Math.max(args.bank.projects.length, 1), MAX_TAILOR_PROJECTS),
  })

  // Deterministic mode: selection + ordering only.
  // Bullets stay as-is; fitter will trim counts/bullets for page fit.
  return { experienceIds, projectIds, experiences: [], projects: [] }
}

