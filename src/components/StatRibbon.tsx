type StatRibbonProps = {
  collected: number
  missing: number
  duplicates: number
  completion: string
}

export function StatRibbon({
  collected,
  missing,
  duplicates,
  completion,
}: StatRibbonProps) {
  return (
    <section className="stat-ribbon" aria-label="Collection summary">
      <article className="stat-card">
        <p className="stat-label">Collected</p>
        <p className="stat-value">{collected}</p>
      </article>
      <article className="stat-card stat-card-accent">
        <p className="stat-label">Missing</p>
        <p className="stat-value">{missing}</p>
      </article>
      <article className="stat-card">
        <p className="stat-label">Duplicates</p>
        <p className="stat-value">{duplicates}</p>
      </article>
      <article className="stat-card stat-card-goal">
        <p className="stat-label">Completion</p>
        <p className="stat-value">{completion}</p>
      </article>
    </section>
  )
}
