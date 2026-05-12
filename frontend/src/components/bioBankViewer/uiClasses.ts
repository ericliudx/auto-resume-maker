/** Shared Tailwind class strings for the bio bank panel. */

export function cardClass(): string {
  return 'rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_92%,var(--text-h)_8%)] p-3 shadow-sm'
}

export function sectionTitleClass(): string {
  return 'm-0 text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--text-h)_55%,transparent)]'
}

export function detailsShellClass(): string {
  return 'shrink-0 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_94%,var(--text-h)_6%)] px-3 py-2'
}

export function jsonPreClass(maxHeight: 'max-h-[32vh]' | 'max-h-[40vh]'): string {
  return [
    `mt-2 ${maxHeight} overflow-auto`,
    'm-0 rounded-md bg-[var(--code-bg)] p-3',
    'font-mono text-[11px] leading-[1.45] text-[var(--text-h)] whitespace-pre-wrap break-words',
  ].join(' ')
}
