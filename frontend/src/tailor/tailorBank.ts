import type { BioBank, BioSkills } from '../resume/data/bioTypes'
import type { TailorModelResult } from './tailorTypes'
import { sanitizeResumeBank } from './resumeTypography'

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

  const baseDoc = baseSkills[0]
  const baseGroups = Array.isArray(baseDoc.groups) ? [...baseDoc.groups] : []

  let found = false
  const mergedGroups = baseGroups.map((g) => {
    if (normSkillGroupName(g.name) !== 'technical') return g
    found = true
    return { ...g, items: [...patchTechnical.items] }
  })

  if (!found) {
    mergedGroups.unshift({ name: 'technical', items: [...patchTechnical.items] })
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
  }
}

export function bankFingerprint(bank: BioBank): string {
  const exp = bank.experiences.slice(0, 3).map((e) => e.id).join(', ')
  const proj = bank.projects.slice(0, 3).map((p) => p.id).join(', ')
  return `exp[0..2]=${exp || '(none)'}; proj[0..2]=${proj || '(none)'}`
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

