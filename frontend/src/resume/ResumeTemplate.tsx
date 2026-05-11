import type { BioBank, BioDateRange, BioEducation, BioExperience, BioProject, BioSkills } from './bioTypes'
import type { ResumeContact } from './contact'

function isNonEmptyString(x: unknown): x is string {
  return typeof x === 'string' && x.trim() !== ''
}

function hasBioDates(d: BioDateRange | undefined): boolean {
  return Boolean(d?.start_date?.trim() || d?.end_date?.trim())
}

/** Single-line fallback (e.g. next to project name in the header). */
function formatBioDateRangeCompact(d: BioDateRange | undefined): string {
  const s = d?.start_date?.trim()
  const e = d?.end_date?.trim()
  if (!s) return e ?? ''
  if (!e) return s
  return `${s} – ${e}`
}

function BioDateLabels({ dates }: { dates: BioDateRange }) {
  const start = dates.start_date?.trim()
  const end = dates.end_date?.trim()
  if (!start && !end) return null
  return (
    <div className="rt__itemDates">
      {start ? <div>Start date: {start}</div> : null}
      {end ? <div>End date: {end}</div> : null}
    </div>
  )
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
  const header = isNonEmptyString(x.header)
    ? x.header
    : [x.company, x.name].filter((p): p is string => isNonEmptyString(p)).join(' — ')

  if (!isNonEmptyString(header)) return null

  return (
    <div className="rt__item" key={x.id}>
      <div className="rt__itemTop">
        <div className="rt__itemHeader">{header}</div>
        {hasBioDates(x.dates) && x.dates ? <BioDateLabels dates={x.dates} /> : null}
      </div>
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
  const dateCompact = formatBioDateRangeCompact(x.dates)
  const header = isNonEmptyString(x.header)
    ? x.header
    : [x.name, dateCompact].filter((p): p is string => isNonEmptyString(p)).join(' · ')

  if (!isNonEmptyString(header)) return null

  return (
    <div className="rt__item" key={x.id}>
      <div className="rt__itemTop">
        <div className="rt__itemHeader">{header}</div>
        {hasBioDates(x.dates) && x.dates ? <BioDateLabels dates={x.dates} /> : null}
      </div>
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
  const items = groups.flatMap((g) => (Array.isArray(g.items) ? g.items : []))
  const cleaned = items.map((x) => x.trim()).filter((x) => x !== '')
  if (cleaned.length === 0) return null

  return (
    <div className="rt__skills">
      {cleaned.map((line, idx) => (
        <div key={`skills-${idx}`} className="rt__skillsLine">
          {line}
        </div>
      ))}
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
                  <div>{formatEducationLine(e)}</div>
                  {hasBioDates(e.dates) && e.dates ? <BioDateLabels dates={e.dates} /> : null}
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

