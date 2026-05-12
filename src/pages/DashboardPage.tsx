import { AppFrame } from '../components/AppFrame'
import { StatRibbon } from '../components/StatRibbon'

export function DashboardPage() {
  return (
    <AppFrame title="Dashboard">
      <StatRibbon collected={0} missing={980} duplicates={0} completion="0%" />
      <p className="page-lead">
        Track every 2026 World Cup sticker, spotlight what you still need, and
        build a focused swap list before matchday meetups.
      </p>
    </AppFrame>
  )
}
