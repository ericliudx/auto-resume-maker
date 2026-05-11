import type { BioBank, BioEducation, BioExperience, BioProject, BioSkills } from '../resume/data/bioTypes'

/** Normalize punctuation for resume body text (bullets, skills, headers): no em dash, no arrows, plain hyphen instead of en dash. */
export function sanitizeResumeTypography(s: string): string {
  let t = s
    .replace(/\u2014/g, ', ')
    .replace(/\u2013/g, '-')
    .replace(/\u2192/g, ' to ')
    .replace(/\u2190/g, ' from ')
    .replace(/\u21d2/g, ' so ')
    .replace(/\u2194/g, ' and ')
  t = t.replace(/\s+,/g, ',')
  t = t.replace(/,\s*,/g, ',')
  t = t.replace(/\s{2,}/g, ' ')
  return t.trim()
}

function mapStrings(xs: string[] | undefined, fn: (s: string) => string): string[] | undefined {
  if (!Array.isArray(xs)) return xs
  return xs.map((x) => fn(x))
}

function expSanitized(e: BioExperience): BioExperience {
  return {
    ...e,
    header: e.header != null ? sanitizeResumeTypography(e.header) : e.header,
    company: e.company != null ? sanitizeResumeTypography(e.company) : e.company,
    name: e.name != null ? sanitizeResumeTypography(e.name) : e.name,
    title: e.title != null ? sanitizeResumeTypography(e.title) : e.title,
    subtitle: e.subtitle != null ? sanitizeResumeTypography(e.subtitle) : e.subtitle,
    bullets: mapStrings(e.bullets, sanitizeResumeTypography),
    tech: mapStrings(e.tech, sanitizeResumeTypography),
  }
}

function projSanitized(p: BioProject): BioProject {
  return {
    ...p,
    name: p.name != null ? sanitizeResumeTypography(p.name) : p.name,
    role: p.role != null ? sanitizeResumeTypography(p.role) : p.role,
    descriptor: p.descriptor != null ? sanitizeResumeTypography(p.descriptor) : p.descriptor,
    header: p.header != null ? sanitizeResumeTypography(p.header) : p.header,
    bullets: mapStrings(p.bullets, sanitizeResumeTypography),
    tech: mapStrings(p.tech, sanitizeResumeTypography),
  }
}

function eduSanitized(e: BioEducation): BioEducation {
  if (e.type === 'course_bank') {
    return {
      ...e,
      institution: e.institution != null ? sanitizeResumeTypography(e.institution) : e.institution,
      courses: mapStrings(e.courses, sanitizeResumeTypography),
    }
  }
  return {
    ...e,
    institution: e.institution != null ? sanitizeResumeTypography(e.institution) : e.institution,
    entries: e.entries?.map((ent) => ({
      ...ent,
      degree: ent.degree != null ? sanitizeResumeTypography(ent.degree) : ent.degree,
      field: ent.field != null ? sanitizeResumeTypography(ent.field) : ent.field,
      majors: mapStrings(ent.majors, sanitizeResumeTypography),
    })),
  }
}

function skillsSanitized(s: BioSkills): BioSkills {
  return {
    ...s,
    groups: s.groups?.map((g) => ({
      name: sanitizeResumeTypography(g.name),
      items: g.items.map(sanitizeResumeTypography),
    })),
  }
}

/** Apply typography normalization across all resume-visible strings. */
export function sanitizeResumeBank(b: BioBank): BioBank {
  return {
    ...b,
    experiences: b.experiences.map(expSanitized),
    projects: b.projects.map(projSanitized),
    education: b.education.map(eduSanitized),
    skills: b.skills.map(skillsSanitized),
  }
}
