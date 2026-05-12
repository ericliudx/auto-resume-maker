import type { BioSkills } from '../../resume/data/bioTypes'
import { cardClass } from './uiClasses'

export function SkillsReadable({ s }: { s: BioSkills }) {
  return (
    <article className={cardClass()}>
      <p className="m-0 font-mono text-[10px] text-[color-mix(in_srgb,var(--text-h)_45%,transparent)]">
        id: {s.id}
      </p>
      {s.groups?.length ? (
        <div className="mt-2 space-y-2">
          {s.groups.map((g, gi) => (
            <div key={gi}>
              <h4 className="m-0 text-[12px] font-semibold text-[var(--text-h)]">{g.name}</h4>
              <ul className="m-0 mt-1 flex list-none flex-wrap gap-1 p-0">
                {g.items.map((it, ii) => (
                  <li
                    key={ii}
                    className="rounded bg-[var(--code-bg)] px-1.5 py-0.5 text-[11px] text-[var(--text-h)]"
                  >
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="m-0 mt-2 text-[12px] text-[color-mix(in_srgb,var(--text-h)_55%,transparent)]">
          No skill groups.
        </p>
      )}
    </article>
  )
}
