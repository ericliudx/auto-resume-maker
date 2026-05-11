import type { BioSkills } from '../data/bioTypes'

const LEGACY_ORDER = ['technical', 'leadership', 'others'] as const

const LEGACY_LABEL: Record<string, string> = {
  technical: 'Technical',
  leadership: 'Leadership',
  others: 'Others',
}

function dedupeItems(items: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const x of items) {
    const t = x.trim()
    if (!t) continue
    const k = t.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(t)
  }
  return out
}

function collectGroups(skills: BioSkills[]): Map<string, { label: string; items: string[] }> {
  const raw = skills.flatMap((s) => (Array.isArray(s.groups) ? s.groups : []))
  const byKey = new Map<string, { label: string; items: string[] }>()

  for (const g of raw) {
    const nameRaw = typeof g?.name === 'string' ? g.name.trim() : ''
    const key = nameRaw.toLowerCase()
    if (!key) continue
    const items = (Array.isArray(g?.items) ? g.items : [])
      .map((x) => String(x).trim())
      .filter((x) => x !== '')
    if (items.length === 0) continue

    const existing = byKey.get(key)
    const label = existing?.label ?? nameRaw
    const merged = dedupeItems([...(existing?.items ?? []), ...items])
    byKey.set(key, { label, items: merged })
  }

  return byKey
}

function sortGroupKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const ia = LEGACY_ORDER.indexOf(a as (typeof LEGACY_ORDER)[number])
    const ib = LEGACY_ORDER.indexOf(b as (typeof LEGACY_ORDER)[number])
    const aLegacy = ia !== -1
    const bLegacy = ib !== -1
    if (aLegacy && bLegacy) return ia - ib
    if (aLegacy) return -1
    if (bLegacy) return 1
    return a.localeCompare(b)
  })
}

function renderSkills(skills: BioSkills[]) {
  const byKey = collectGroups(skills)
  const keys = sortGroupKeys([...byKey.keys()])
  if (keys.length === 0) return null

  return (
    <div className="rt__skills">
      {keys.map((key) => {
        const row = byKey.get(key)
        if (!row || row.items.length === 0) return null
        const stored = row.label.endsWith(':') ? row.label.slice(0, -1) : row.label
        const label = LEGACY_LABEL[key] ?? stored
        return (
          <div key={key} className="rt__skillsRow">
            <span className="rt__skillsLabel">{label}:</span> {row.items.join(', ')}
          </div>
        )
      })}
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
