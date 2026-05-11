export type TailorModelResult = {
  experienceIds?: string[]
  projectIds?: string[]
  experiences?: Array<{
    id: string
    bullets?: string[]
    title?: string
    subtitle?: string
    header?: string
    tech?: string[]
  }>
  projects?: Array<{
    id: string
    bullets?: string[]
    role?: string
    descriptor?: string
    header?: string
    tech?: string[]
  }>
  skills?: { groups?: Array<{ name: string; items: string[] }> }

  // Keyword-focused tailor metadata (assistive / transparency)
  keywordMap?: Array<{
    keyword: string
    target: 'experience' | 'project'
    id: string
    bulletIndex: number
  }>
  cannotAdd?: Array<{ keyword: string; reason: string }>

  /** Save-to-PDF suggested name when present and valid (`First_Last_Company`). */
  pdfFileName?: string
}

