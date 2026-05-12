import type { BioEducation } from '../../resume/data/bioTypes'
import { formatDateRange } from './formatDateRange'
import { cardClass } from './uiClasses'

export function EducationReadable({ doc }: { doc: BioEducation }) {
  if (doc.type === 'course_bank') {
    return (
      <article className={cardClass()}>
        <h3 className="m-0 text-[13px] font-semibold text-[var(--text-h)]">
          {doc.institution ?? 'Course bank'}
        </h3>
        <p className="m-0 mt-1 font-mono text-[10px] text-[color-mix(in_srgb,var(--text-h)_45%,transparent)]">
          id: {doc.id} · type: course_bank
        </p>
        {doc.courses?.length ? (
          <ul className="m-0 mt-2 flex list-none flex-wrap gap-1 p-0">
            {doc.courses.map((c, i) => (
              <li
                key={i}
                className="rounded border border-[var(--border)] bg-[var(--code-bg)] px-2 py-0.5 text-[11px] leading-snug text-[var(--text-h)]"
              >
                {c}
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 mt-2 text-[12px] text-[color-mix(in_srgb,var(--text-h)_55%,transparent)]">
            No courses listed.
          </p>
        )}
      </article>
    )
  }

  return (
    <article className={cardClass()}>
      <h3 className="m-0 text-[13px] font-semibold text-[var(--text-h)]">
        {doc.institution ?? 'Education'}
      </h3>
      <p className="m-0 mt-1 font-mono text-[10px] text-[color-mix(in_srgb,var(--text-h)_45%,transparent)]">
        id: {doc.id}
      </p>
      {doc.entries?.length ? (
        <ul className="m-0 mt-2 list-none space-y-2 p-0">
          {doc.entries.map((ent) => (
            <li
              key={ent.id}
              className="border-l-2 border-[color-mix(in_srgb,var(--text-h)_22%,transparent)] pl-2"
            >
              <p className="m-0 text-[12px] font-medium text-[var(--text-h)]">
                {[ent.degree, ent.field].filter(Boolean).join(', ') || ent.id}
              </p>
              {ent.majors?.length ? (
                <p className="m-0 mt-0.5 text-[11px] text-[color-mix(in_srgb,var(--text-h)_72%,transparent)]">
                  Majors: {ent.majors.join(', ')}
                </p>
              ) : null}
              {ent.gpa != null ? (
                <p className="m-0 mt-0.5 text-[11px] text-[color-mix(in_srgb,var(--text-h)_55%,transparent)]">
                  GPA: {ent.gpa}
                </p>
              ) : null}
              {formatDateRange(ent.dates) ? (
                <p className="m-0 mt-0.5 text-[11px] text-[color-mix(in_srgb,var(--text-h)_55%,transparent)]">
                  {formatDateRange(ent.dates)}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 mt-2 text-[12px] text-[color-mix(in_srgb,var(--text-h)_55%,transparent)]">
          No entries.
        </p>
      )}
    </article>
  )
}
