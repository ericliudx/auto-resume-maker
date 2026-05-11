import type { BioBank, BioDateRange, BioEducation, BioExperience, BioProject, BioSkills } from './bioTypes'
import type { ResumeContact } from './contact'

function isNonEmptyString(x: unknown): x is string {
  return typeof x === 'string' && x.trim() !== ''
}

function hasBioDates(d: BioDateRange | undefined): boolean {
  return Boolean(d?.start_date?.trim() || d?.end_date?.trim())
}

function formatMonthYear(s: string): string {
  const m = s.match(/^(\d{4})-(\d{2})$/)
  if (!m) return s
  const year = m[1]
  const mm = m[2]
  const monthNames: Record<string, string> = {
    '01': 'Jan',
    '02': 'Feb',
    '03': 'Mar',
    '04': 'Apr',
    '05': 'May',
    '06': 'Jun',
    '07': 'Jul',
    '08': 'Aug',
    '09': 'Sep',
    '10': 'Oct',
    '11': 'Nov',
    '12': 'Dec',
  }
  const mon = monthNames[mm]
  return mon ? `${mon} ${year}` : s
}

function formatDateToken(s: string): string {
  // Leave years ("2025") and already-formatted month words ("Jun 2024") alone.
  // Convert only strict YYYY-MM to "Mon YYYY".
  return formatMonthYear(s)
}

/** Single-line date range (for right-aligned dates). */
function formatBioDateRangeCompact(d: BioDateRange | undefined): string {
  const sRaw = d?.start_date?.trim()
  const eRaw = d?.end_date?.trim()
  const s = sRaw ? formatDateToken(sRaw) : undefined
  const e = eRaw ? formatDateToken(eRaw) : undefined
  if (!s) return e ?? ''
  if (!e) return `${s} to present`
  return `${s} – ${e}`
}

function BioDateLabels({ dates }: { dates: BioDateRange }) {
  const compact = formatBioDateRangeCompact(dates)
  if (!isNonEmptyString(compact)) return null
  return <div className="rt__itemDates">{compact}</div>
}

function parseHeaderPipe(header: string | undefined): { left?: string; right?: string } {
  if (!isNonEmptyString(header)) return {}
  const parts = header.split('|').map((p) => p.trim()).filter((p) => p !== '')
  if (parts.length < 2) return { left: header }
  return { left: parts[0], right: parts.slice(1).join(' | ') }
}

function formatEducationLine(entry: NonNullable<BioEducation['entries']>[number]): string {
  const degree = isNonEmptyString(entry.degree) ? entry.degree : ''
  const majors =
    Array.isArray(entry.majors) && entry.majors.length > 0 ? entry.majors.join(', ') : undefined
  const field = isNonEmptyString(entry.field) ? entry.field : undefined
  const gpa = typeof entry.gpa === 'number' ? `GPA: ${entry.gpa.toFixed(2)}` : undefined

  const focus = majors ?? field
  const parts = [degree, focus].filter((p): p is string => isNonEmptyString(p))
  const left = parts.join(', ')
  const right = gpa ? `(${gpa})` : ''
  return [left, right].filter((p) => p !== '').join(' ')
}

function sectionTitle(title: string) {
  return (
    <div className="rt__sectionTitle" role="heading" aria-level={2}>
      {title}
    </div>
  )
}

function renderExperience(x: BioExperience) {
  const headerParts = parseHeaderPipe(x.header)
  const topLeft =
    [x.company, x.name].filter((p): p is string => isNonEmptyString(p)).join(' | ') ||
    headerParts.left ||
    ''
  const topRightItalic = headerParts.right

  const titleLine =
    [x.title, x.subtitle]
      .filter((p): p is string => isNonEmptyString(p))
      .join(' | ') || undefined

  if (!isNonEmptyString(topLeft)) return null

  return (
    <div className="rt__item" key={x.id}>
      <div className="rt__itemTop">
        <div className="rt__itemHeader">
          {topLeft}
          {isNonEmptyString(topRightItalic) ? (
            <span className="rt__mutedItalic"> | {topRightItalic}</span>
          ) : null}
        </div>
        {hasBioDates(x.dates) && x.dates ? <BioDateLabels dates={x.dates} /> : null}
      </div>
      {isNonEmptyString(titleLine) ? <div className="rt__subline">{titleLine}</div> : null}
      {Array.isArray(x.bullets) && x.bullets.length > 0 ? (
        <ul className="rt__bullets">
          {x.bullets.map((b, i) => (
            <li key={`${x.id}-b-${i}`}>{b}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function renderProject(x: BioProject) {
  const headerParts = parseHeaderPipe(x.header)
  const name = isNonEmptyString(x.name) ? x.name : headerParts.left
  const descriptor =
    isNonEmptyString(x.descriptor) ? x.descriptor : headerParts.right

  if (!isNonEmptyString(name)) return null

  return (
    <div className="rt__item" key={x.id}>
      <div className="rt__itemTop">
        <div className="rt__itemHeader">
          {name}
          {isNonEmptyString(descriptor) ? <span className="rt__mutedItalic"> | {descriptor}</span> : null}
        </div>
        {hasBioDates(x.dates) && x.dates ? <BioDateLabels dates={x.dates} /> : null}
      </div>
      {isNonEmptyString(x.role) ? <div className="rt__subline">{x.role}</div> : null}
      {Array.isArray(x.bullets) && x.bullets.length > 0 ? (
        <ul className="rt__bullets">
          {x.bullets.map((b, i) => (
            <li key={`${x.id}-b-${i}`}>{b}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function renderSkills(skills: BioSkills[]) {
  const groups = skills.flatMap((s) => (Array.isArray(s.groups) ? s.groups : []))

  function groupItems(name: string): string[] {
    const g = groups.find((x) => x?.name?.toLowerCase() === name)
    const items = Array.isArray(g?.items) ? g.items : []
    return items.map((x) => x.trim()).filter((x) => x !== '')
  }

  const technical = groupItems('technical')
  const leadership = groupItems('leadership')
  const others = groupItems('others')

  const any = technical.length + leadership.length + others.length
  if (any === 0) return null

  return (
    <div className="rt__skills">
      {technical.length > 0 ? (
        <div className="rt__skillsRow">
          <span className="rt__skillsLabel">Technical:</span> {technical.join(', ')}
        </div>
      ) : null}
      {leadership.length > 0 ? (
        <div className="rt__skillsRow">
          <span className="rt__skillsLabel">Leadership:</span> {leadership.join(', ')}
        </div>
      ) : null}
      {others.length > 0 ? (
        <div className="rt__skillsRow">
          <span className="rt__skillsLabel">Others:</span> {others.join(', ')}
        </div>
      ) : null}
    </div>
  )
}

export function ResumeTemplate({
  bank,
  contact,
}: {
  bank: BioBank
  contact: ResumeContact
}) {
  const educationDoc = bank.education.find((e) => e.type === 'education')
  const courseBank = bank.education.find((e) => e.type === 'course_bank')

  const educationEntries = Array.isArray(educationDoc?.entries) ? educationDoc.entries : []
  const educationInstitution = isNonEmptyString(educationDoc?.institution)
    ? educationDoc.institution
    : 'University'

  const courses = Array.isArray(courseBank?.courses) ? courseBank.courses : []

  return (
    <article className="rt" aria-label="Resume template">
      <header className="rt__header">
        <div className="rt__name">{contact.name}</div>
        <div className="rt__contact">
          {[contact.location, contact.phone, contact.email, contact.linkedin]
            .map((x) => x.trim())
            .filter((x) => x !== '')
            .join(' · ')}
        </div>
      </header>

      <section className="rt__section" aria-label="Education">
        {sectionTitle('EDUCATION')}
        <div className="rt__item">
          <div className="rt__itemTop">
            <div className="rt__itemHeader">{educationInstitution}</div>
          </div>
          {educationEntries.length > 0 ? (
            <ul className="rt__bullets rt__bullets--tight">
              {educationEntries.map((e) => (
                <li key={e.id}>
                  <div className="rt__itemTop rt__itemTop--inList">
                    <div>{formatEducationLine(e)}</div>
                    {hasBioDates(e.dates) && e.dates ? <BioDateLabels dates={e.dates} /> : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          {courses.length > 0 ? (
            <div className="rt__courses">
              <span className="rt__label">Relevant Courses:</span> {courses.join(', ')}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rt__section" aria-label="Experience">
        {sectionTitle('EXPERIENCE')}
        {bank.experiences.map(renderExperience)}
      </section>

      <section className="rt__section" aria-label="Projects">
        {sectionTitle('PROJECTS')}
        {bank.projects.map(renderProject)}
      </section>

      <section className="rt__section" aria-label="Skills">
        {sectionTitle('SKILLS')}
        {renderSkills(bank.skills)}
      </section>
    </article>
  )
}

