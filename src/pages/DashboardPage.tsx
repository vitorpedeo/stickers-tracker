import { useQuery } from '@tanstack/react-query'
import { AppFrame } from '../components/AppFrame'
import { repository } from '../data/repositorySingleton'
import { buildTeamProgress, summarizeAlbum } from '../domain/progress'
import type { TeamGroup } from '../domain/types'
import { useInitializeSeed } from '../features/stickers/hooks'

const GROUPS: TeamGroup[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

function formatLastUpdate(updatedAt: number | null) {
  if (!updatedAt) {
    return 'No sticker updates yet.'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(updatedAt))
}

export function DashboardPage() {
  const seedInit = useInitializeSeed()

  const { data } = useQuery({
    queryKey: ['dashboard-view'],
    enabled: seedInit.isSuccess,
    queryFn: async () => {
      const [teams, stickers, entries] = await Promise.all([
        repository.listTeams(),
        repository.listStickers(),
        repository.listEntries(),
      ])

      const teamProgress = buildTeamProgress(teams, stickers, entries)
      const album = summarizeAlbum(teams, stickers, entries)

      const groupProgress = GROUPS.map((group) => {
        const teamsInGroup = teamProgress.filter((item) => item.team.group === group)
        const collected = teamsInGroup.reduce((acc, item) => acc + item.collected, 0)
        const total = teamsInGroup.reduce((acc, item) => acc + item.total, 0)
        const progress = total === 0 ? 0 : Math.round((collected / total) * 100)

        return { group, collected, total, progress }
      })

      return {
        album,
        groupProgress,
      }
    },
  })

  return (
    <AppFrame>
      <section className="page-head">
        <div>
          <h1 className="page-title">World Cup 2026 Sticker Tracker</h1>
          <p className="page-subtitle">Collection tracking summary</p>
        </div>
        <span className="chip">Playable prototype</span>
      </section>

      <section className="metrics-grid" aria-label="Album metrics">
        <article className="panel metric-card metric-card-accent">
          <p className="metric-label">Album completion</p>
          <p className="metric-value">{data?.album.completion ?? 0}%</p>
        </article>
        <article className="panel metric-card">
          <p className="metric-label">Total stickers</p>
          <p className="metric-value">{data?.album.total ?? 0}</p>
        </article>
        <article className="panel metric-card">
          <p className="metric-label">Collected</p>
          <p className="metric-value">{data?.album.collected ?? 0}</p>
        </article>
        <article className="panel metric-card">
          <p className="metric-label">Missing</p>
          <p className="metric-value">{data?.album.missing ?? 0}</p>
        </article>
        <article className="panel metric-card">
          <p className="metric-label">Duplicate copies</p>
          <p className="metric-value">{data?.album.duplicateCopies ?? 0}</p>
        </article>
      </section>

      <section className="dashboard-columns">
        <article className="panel">
          <h2 className="panel-title">Group progress map</h2>
          <div className="group-list">
            {(data?.groupProgress ?? []).map((item) => (
              <div key={item.group} className="group-row">
                <div className="group-row-head">
                  <p>Group {item.group}</p>
                  <p>
                    {item.collected}/{item.total}
                  </p>
                </div>
                <div className="progress-track" aria-hidden="true">
                  <span className="progress-fill" style={{ width: `${item.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2 className="panel-title">Session status</h2>
          <p className="meta-line">
            Last update: <strong>{formatLastUpdate(data?.album.updatedAt ?? null)}</strong>
          </p>
          <p className="meta-tip">
            Tip: use bulk input formats like <code>1-5, 9, 14</code> on team pages.
          </p>
        </article>
      </section>
    </AppFrame>
  )
}
