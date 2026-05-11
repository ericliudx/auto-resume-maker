/** `end_date` omitted when the role or project is ongoing or the end is unknown. */
export type BioDateRange = {
  start_date?: string
  end_date?: string
}

export type BioExperience = {
  id: string
  type: 'experience'
  header?: string
  company?: string
  name?: string
  dates?: BioDateRange
  bullets?: string[]
  tech?: string[]
}

export type BioProject = {
  id: string
  type: 'project'
  name?: string
  role?: string
  header?: string
  dates?: BioDateRange
  bullets?: string[]
  tech?: string[]
}

export type BioEducation = {
  id: string
  type: 'education' | 'course_bank'
  institution?: string
  entries?: Array<{
    id: string
    degree?: string
    field?: string
    majors?: string[]
    gpa?: number
    dates?: BioDateRange
  }>
  courses?: string[]
}

export type BioSkills = {
  id: string
  type: 'skills'
  groups?: Array<{ name: string; items: string[] }>
}

export type BioBank = {
  experiences: BioExperience[]
  projects: BioProject[]
  education: BioEducation[]
  skills: BioSkills[]
}

export type BioBankResponse =
  | { ok: true; result: BioBank }
  | { ok: false; error: { code: string; message: string } }

