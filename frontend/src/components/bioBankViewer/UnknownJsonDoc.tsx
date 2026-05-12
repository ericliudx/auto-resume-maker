import { cardClass } from './uiClasses'

const SUMMARY_TEXT_KEYS = ['text', 'body', 'summary', 'headline', 'content', 'description'] as const

export function UnknownJsonDoc({ doc, index }: { doc: unknown; index: number }) {
  if (doc && typeof doc === 'object' && !Array.isArray(doc)) {
    const o = doc as Record<string, unknown>
    const label =
      (typeof o.id === 'string' && o.id) ||
      (typeof o.name === 'string' && o.name) ||
      (typeof o.title === 'string' && o.title) ||
      `Item ${index + 1}`
    for (const k of SUMMARY_TEXT_KEYS) {
      const v = o[k]
      if (typeof v === 'string' && v.trim()) {
        return (
          <article className={cardClass()}>
            <h3 className="m-0 text-[13px] font-semibold text-[var(--text-h)]">{label}</h3>
            <p className="m-0 mt-2 whitespace-pre-wrap text-[12px] leading-[1.45] text-[var(--text-h)]">
              {v.trim()}
            </p>
          </article>
        )
      }
    }
  }

  return (
    <article className={cardClass()}>
      <pre className="m-0 overflow-x-auto font-mono text-[11px] leading-[1.4] text-[var(--text-h)]">
        {JSON.stringify(doc, null, 2)}
      </pre>
    </article>
  )
}
