import { AppFrame } from '../components/AppFrame'
import { StatRibbon } from '../components/StatRibbon'
import { buildInitialCollection } from '../domain/seed'

export function DashboardPage() {
  const { stickers } = buildInitialCollection()

  return (
    <AppFrame title="Dashboard">
      <StatRibbon
        collected={0}
        missing={stickers.length}
        duplicates={0}
        completion="0%"
      />
      <p className="page-lead">
        Track every 2026 World Cup sticker, spotlight what you still need, and
        build a focused swap list before matchday meetups.
      </p>
    </AppFrame>
  )
}
