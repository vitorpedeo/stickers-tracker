import { AppFrame } from '../components/AppFrame'
import { StatRibbon } from '../components/StatRibbon'
import { useDashboardSummary, useInitializeSeed } from '../features/stickers/hooks'

export function DashboardPage() {
  const seedInit = useInitializeSeed()
  const { data } = useDashboardSummary(seedInit.isSuccess)

  return (
    <AppFrame title="Dashboard">
      <StatRibbon
        collected={data?.collected ?? 0}
        missing={data?.missing ?? 0}
        duplicates={data?.duplicates ?? 0}
        completion={data?.completion ?? '0%'}
      />
      <p className="page-lead">
        Track every 2026 World Cup sticker, spotlight what you still need, and
        build a focused swap list before matchday meetups.
      </p>
    </AppFrame>
  )
}
