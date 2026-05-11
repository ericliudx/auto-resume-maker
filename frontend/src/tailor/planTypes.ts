import type { AtsRole } from '../ats/keywordExtract'

export type TailorPlan = {
  role: AtsRole
  keywordLimit: number
  mustIncludeExperienceIds: string[]
  mustIncludeProjectIds: string[]
  forceKeywords: string[]
}

export type TailorPlanV2 = {
  role: AtsRole
  keywordLimit: number
  experienceIds: string[]
  projectIds: string[]
  experiencePatches?: Array<{
    id: string
    bullets?: string[]
    title?: string
    subtitle?: string
    header?: string
    tech?: string[]
  }>
  projectPatches?: Array<{
    id: string
    bullets?: string[]
    role?: string
    descriptor?: string
    header?: string
    tech?: string[]
  }>
  skillsGroups?: Array<{ name: string; items: string[] }>
  relevantCourses?: string[]
  /** Print/PDF basename: `First_Last_Company` (underscores, ASCII). */
  pdfFileName?: string
}

