export type StickerFilter = 'all' | 'missing' | 'collected'

type FilterDockProps = {
  value: StickerFilter
  onChange: (next: StickerFilter) => void
}

export function FilterDock({ value, onChange }: FilterDockProps) {
  return (
    <fieldset className="filter-dock">
      <legend>Status filter</legend>
      <button type="button" onClick={() => onChange('all')} aria-pressed={value === 'all'}>
        All
      </button>
      <button
        type="button"
        onClick={() => onChange('missing')}
        aria-pressed={value === 'missing'}
      >
        Missing
      </button>
      <button
        type="button"
        onClick={() => onChange('collected')}
        aria-pressed={value === 'collected'}
      >
        Collected
      </button>
    </fieldset>
  )
}
