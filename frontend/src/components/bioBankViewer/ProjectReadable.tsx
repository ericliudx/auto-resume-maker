import type { BioProject } from '../../resume/data/bioTypes'
import { formatDateRange } from './formatDateRange'
import { ResumeTagBadge } from './ResumeTagBadge'
import { cardClass } from './uiClasses'

export function ProjectReadable({
  p,
  tailorOnResume,
}: {
  p: BioProject
  tailorOnResume?: boolean
}) {
  const headline = p.name ?? p.header ?? 'Project'
  const sub = [p.role, p.descriptor].filter(Boolean).join(' · ')
  const dates = formatDateRange(p.dates)

  return (
    <article className={cardClass()}>
      <h3 className="m-0 flex flex-wrap items-baseline gap-x-2 text-[13px] font-semibold text-[var(--text-h)]">
        <span>{headline}</span>
        {tailorOnResume ? <ResumeTagBadge /> : null}
      </h3>
      {sub ? (
        <p className="m-0 mt-0.5 text-[12px] text-[color-mix(in_srgb,var(--text-h)_78%,transparent)]">
          {sub}
        </p>
      ) : null}
      {dates ? (
        <p className="m-0 mt-1 text-[11px] text-[color-mix(in_srgb,var(--text-h)_55%,transparent)]">
          {dates}
        </p>
      ) : null}
      {p.bullets?.length ? (
        <ul className="m-0 mt-2 list-disc pl-[1.15rem] text-[12px] leading-[1.45] text-[var(--text-h)]">
          {p.bullets.map((b, i) => (
            <li key={i} className="mt-0.5">
              {b}
            </li>
          ))}
        </ul>
      ) : null}
      {p.tech?.length ? (
        <ul className="m-0 mt-2 flex list-none flex-wrap gap-1 p-0">
          {p.tech.map((t, i) => (
            <li
              key={i}
              className="rounded bg-[var(--code-bg)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-h)]"
            >
              {t}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="m-0 mt-2 font-mono text-[10px] text-[color-mix(in_srgb,var(--text-h)_45%,transparent)]">
        id: {p.id}
      </p>
    </article>
  )
}
