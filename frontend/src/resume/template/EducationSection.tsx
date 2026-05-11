import type { BioEducation } from '../data/bioTypes'
import { BioDateLabels, SectionTitle } from './atoms'
import { formatEducationLine, hasBioDates, isNonEmptyString } from './templateUtils'

export function EducationSection({
  educationDoc,
  courseBank,
}: {
  educationDoc: BioEducation | undefined
  courseBank: BioEducation | undefined
}) {
  const educationEntries = Array.isArray(educationDoc?.entries) ? educationDoc.entries : []
  const educationInstitution = isNonEmptyString(educationDoc?.institution)
    ? educationDoc.institution
    : 'University'

  const courses = Array.isArray(courseBank?.courses) ? courseBank.courses : []

  return (
    <section className="rt__section" aria-label="Education">
      <SectionTitle title="EDUCATION" />
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
  )
}

