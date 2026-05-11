type Tab<T extends string> = {
  id: T
  label: string
}

export function SegmentedTabs<T extends string>({
  value,
  tabs,
  onChange,
  ariaLabel,
}: {
  value: T
  tabs: Array<Tab<T>>
  onChange: (next: T) => void
  ariaLabel: string
}) {
  return (
    <div
      className="inline-flex items-center gap-0 p-0.5 rounded-xl border border-[var(--border)] bg-[var(--social-bg)] shadow-[0_1px_0_rgba(0,0,0,0.03)]"
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={[
              'cursor-pointer text-xs font-semibold leading-none px-2.5 py-[7px] rounded-[10px]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_srgb,#0b57d0_45%,white)]',
              active
                ? 'bg-white shadow-[0_1px_0_rgba(0,0,0,0.06),_0_0_0_1px_color-mix(in_srgb,var(--border)_90%,white)]'
                : 'bg-transparent hover:bg-[color-mix(in_srgb,var(--social-bg)_55%,white)]',
            ].join(' ')}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

