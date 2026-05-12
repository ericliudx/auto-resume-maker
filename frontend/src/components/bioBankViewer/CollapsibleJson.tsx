import { detailsShellClass, jsonPreClass } from './uiClasses'

export function CollapsibleJson({
  summary,
  jsonText,
  maxHeight,
}: {
  summary: string
  jsonText: string
  maxHeight: 'max-h-[32vh]' | 'max-h-[40vh]'
}) {
  return (
    <details className={detailsShellClass()}>
      <summary className="cursor-pointer select-none text-[12px] font-medium text-[var(--text-h)]">
        {summary}
      </summary>
      <pre className={jsonPreClass(maxHeight)}>{jsonText}</pre>
    </details>
  )
}
