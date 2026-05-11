import type { BioProject } from '../data/bioTypes'
import { BioDateLabels, SectionTitle } from './atoms'
import { hasBioDates, isNonEmptyString, parseHeaderPipe } from './templateUtils'

function ProjectItem({ x }: { x: BioProject }) {
  const headerParts = parseHeaderPipe(x.header)
  const name = isNonEmptyString(x.name) ? x.name : headerParts.left
  const descriptor = isNonEmptyString(x.descriptor) ? x.descriptor : headerParts.right

  if (!isNonEmptyString(name)) return null

  return (
    <div className="rt__item" key={x.id}>
      <div className="rt__itemTop">
        <div className="rt__itemHeader">
          {name}
          {isNonEmptyString(descriptor) ? (
            <span className="rt__mutedItalic"> | {descriptor}</span>
          ) : null}
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

export function ProjectsSection({ projects }: { projects: BioProject[] }) {
  return (
    <section className="rt__section" aria-label="Projects">
      <SectionTitle title="PROJECTS" />
      {projects.map((x) => (
        <ProjectItem key={x.id} x={x} />
      ))}
    </section>
  )
}

