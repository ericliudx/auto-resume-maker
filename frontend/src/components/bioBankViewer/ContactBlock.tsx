import type { ResumeContact } from '../../resume/data/contact'

export function ContactBlock({
  loading,
  contact,
}: {
  loading: boolean
  contact: ResumeContact | null
}) {
  if (loading) {
    return (
      <p className="m-0 text-[12px] text-[color-mix(in_srgb,var(--text-h)_55%,transparent)]">
        Loading contact…
      </p>
    )
  }
  if (!contact) {
    return (
      <p className="m-0 text-[12px] text-[color-mix(in_srgb,var(--text-h)_55%,transparent)]">
        No on-disk <span className="font-mono">bio/contact.json</span> (or it failed validation). The
        resume may still use browser-stored contact from the print flow.
      </p>
    )
  }

  const rows: Array<{ k: string; v: string; href?: string }> = [
    { k: 'Name', v: contact.name },
    { k: 'Location', v: contact.location },
    { k: 'Phone', v: contact.phone },
    { k: 'Email', v: contact.email, href: `mailto:${contact.email}` },
    {
      k: 'LinkedIn',
      v: contact.linkedin,
      href: contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`,
    },
    {
      k: 'GitHub',
      v: contact.github,
      href: contact.github.startsWith('http') ? contact.github : `https://${contact.github}`,
    },
  ]

  return (
    <dl className="m-0 grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-1.5 text-[12px] leading-snug">
      {rows.map(({ k, v, href }) => (
        <div key={k} className="contents">
          <dt className="m-0 text-[color-mix(in_srgb,var(--text-h)_55%,transparent)]">{k}</dt>
          <dd className="m-0 min-w-0 break-words text-[var(--text-h)]">
            {href ? (
              <a
                className="text-[var(--text-h)] underline decoration-[color-mix(in_srgb,var(--text-h)_35%,transparent)]"
                href={href}
              >
                {v}
              </a>
            ) : (
              v
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
