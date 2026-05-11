import type { BioSkills } from '../data/bioTypes'

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

export function SkillsSection({ skills }: { skills: BioSkills[] }) {
  return (
    <section className="rt__section" aria-label="Skills">
      <div className="rt__sectionTitle" role="heading" aria-level={2}>
        SKILLS
      </div>
      {renderSkills(skills)}
    </section>
  )
}

