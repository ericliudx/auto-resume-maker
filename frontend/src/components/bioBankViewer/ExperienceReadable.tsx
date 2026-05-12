import type { BioExperience } from '../../resume/data/bioTypes'
import { formatDateRange } from './formatDateRange'
import { ResumeTagBadge } from './ResumeTagBadge'
import { cardClass } from './uiClasses'

export function ExperienceReadable({
  e,
  tailorOnResume,
}: {
  e: BioExperience
  tailorOnResume?: boolean
}) {
  const headline =
    e.title ??
    e.header ??
    e.name ??
    (e.company ? `${e.company}` : 'Experience')
  const sub =
    [e.company && e.title ? e.company : null, e.subtitle].filter(Boolean).join(' · ') ||
    (e.company && !e.title ? e.company : '') ||
    e.name ||
    ''
  const dates = formatDateRange(e.dates)

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
      {e.bullets?.length ? (
        <ul className="m-0 mt-2 list-disc pl-[1.15rem] text-[12px] leading-[1.45] text-[var(--text-h)]">
          {e.bullets.map((b, i) => (
            <li key={i} className="mt-0.5">
              {b}
            </li>
          ))}
        </ul>
      ) : null}
      {e.tech?.length ? (
        <ul className="m-0 mt-2 flex list-none flex-wrap gap-1 p-0">
          {e.tech.map((t, i) => (
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
        id: {e.id}
      </p>
    </article>
  )
}
