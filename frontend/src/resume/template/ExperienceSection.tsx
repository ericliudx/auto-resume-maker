import type { BioExperience } from '../data/bioTypes'
import { BioDateLabels, SectionTitle } from './atoms'
import { hasBioDates, isNonEmptyString, parseHeaderPipe } from './templateUtils'

function ExperienceItem({ x }: { x: BioExperience }) {
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

export function ExperienceSection({ experiences }: { experiences: BioExperience[] }) {
  return (
    <section className="rt__section" aria-label="Experience">
      <SectionTitle title="EXPERIENCE" />
      {experiences.map((x) => (
        <ExperienceItem key={x.id} x={x} />
      ))}
    </section>
  )
}

