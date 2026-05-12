import type { BioBank, BioSkills } from '../resume/data/bioTypes'
import { MAX_SKILLS_PER_GROUP } from '../resume/skillsCap'
import { capRelevantCoursesList } from './relevantCoursesCap'
import type { TailorModelResult } from './tailorTypes'
import { sanitizeResumeBank, sanitizeResumeTypography } from './resumeTypography'

function normSkillGroupName(s: string): string {
  return s.trim().toLowerCase()
}

/** Replace only the `technical` group from the patch; keep `leadership` and `others` from the base bio. */
function mergeSkillsTechnicalOnly(
  baseSkills: BioSkills[],
  patchGroups: Array<{ name: string; items: string[] }> | undefined,
): BioSkills[] {
  if (!baseSkills[0] || !patchGroups?.length) return baseSkills

  const patchTechnical = patchGroups.find((g) => normSkillGroupName(g.name) === 'technical')
  if (!patchTechnical || !Array.isArray(patchTechnical.items)) return baseSkills

  const technicalItems = patchTechnical.items.slice(0, MAX_SKILLS_PER_GROUP)

  const baseDoc = baseSkills[0]
  const baseGroups = Array.isArray(baseDoc.groups) ? [...baseDoc.groups] : []

  let found = false
  const mergedGroups = baseGroups.map((g) => {
    if (normSkillGroupName(g.name) !== 'technical') return g
    found = true
    return { ...g, items: [...technicalItems] }
  })

  if (!found) {
    mergedGroups.unshift({ name: 'technical', items: [...technicalItems] })
  }

  return [{ ...baseDoc, groups: mergedGroups }]
}

export function makeBankForPrompt(bank: BioBank): unknown {
  return {
    experiences: bank.experiences.map((e) => ({
      id: e.id,
      company: e.company,
      title: e.title,
      subtitle: e.subtitle,
      header: e.header,
      dates: e.dates,
      bullets: e.bullets,
      tech: e.tech,
    })),
    projects: bank.projects.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      descriptor: p.descriptor,
      header: p.header,
      dates: p.dates,
      bullets: p.bullets,
      tech: p.tech,
    })),
    education: bank.education,
    skills: bank.skills,
    summaries: bank.summaries ?? [],
    certifications: bank.certifications ?? [],
  }
}

/** Replace `course_bank` entries with the tailored course name list (subset of the bank). */
export function applyRelevantCourses(next: BioBank, courses: string[]): BioBank {
  const capped = capRelevantCoursesList(courses) ?? []
  if (!capped.length) return next
  const sanitized = capped.map((c) => sanitizeResumeTypography(String(c)))
  return {
    ...next,
    education: next.education.map((e) =>
      e.type === 'course_bank' ? { ...e, courses: sanitized } : e,
    ),
  }
}

export function bankFingerprint(bank: BioBank): string {
  const exp = bank.experiences.slice(0, 3).map((e) => e.id).join(', ')
  const proj = bank.projects.slice(0, 3).map((p) => p.id).join(', ')
  return `exp[0..2]=${exp || '(none)'}; proj[0..2]=${proj || '(none)'}`
}

/** Apply stored tailor patch including optional `relevantCourses` overlay. */
export function applyTailorPatchToBank(base: BioBank, patch: TailorModelResult): BioBank {
  let next = applyTailorResult(base, patch)
  if (patch.relevantCourses?.length) {
    next = applyRelevantCourses(next, patch.relevantCourses)
  }
  return next
}

export function applyTailorResult(base: BioBank, r: TailorModelResult): BioBank {
  const expById = new Map(base.experiences.map((e) => [e.id, e]))
  const projById = new Map(base.projects.map((p) => [p.id, p]))

  const expPatches = new Map((r.experiences ?? []).map((e) => [e.id, e]))
  const projPatches = new Map((r.projects ?? []).map((p) => [p.id, p]))

  const orderedExperiences = (r.experienceIds ?? base.experiences.map((e) => e.id))
    .map((id) => expById.get(id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
    .map((e) => {
      const p = expPatches.get(e.id)
      if (!p) return e
      return {
        ...e,
        header: typeof p.header === 'string' ? p.header : e.header,
        title: typeof p.title === 'string' ? p.title : e.title,
        subtitle: typeof p.subtitle === 'string' ? p.subtitle : e.subtitle,
        tech: Array.isArray(p.tech) ? p.tech : e.tech,
        bullets: Array.isArray(p.bullets) ? p.bullets : e.bullets,
      }
    })

  const orderedProjects = (r.projectIds ?? base.projects.map((p) => p.id))
    .map((id) => projById.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => {
      const patch = projPatches.get(p.id)
      if (!patch) return p
      return {
        ...p,
        header: typeof patch.header === 'string' ? patch.header : p.header,
        role: typeof patch.role === 'string' ? patch.role : p.role,
        descriptor: typeof patch.descriptor === 'string' ? patch.descriptor : p.descriptor,
        tech: Array.isArray(patch.tech) ? patch.tech : p.tech,
        bullets: Array.isArray(patch.bullets) ? patch.bullets : p.bullets,
      }
    })

  const skills = r.skills?.groups?.length
    ? mergeSkillsTechnicalOnly(base.skills, r.skills.groups)
    : base.skills

  return sanitizeResumeBank({
    ...base,
    experiences: orderedExperiences,
    projects: orderedProjects,
    skills,
  })
}

