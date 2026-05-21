import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppFrame } from '../components/AppFrame'
import { repository } from '../data/repositorySingleton'
import { buildTeamProgress } from '../domain/progress'
import { useInitializeSeed } from '../features/stickers/hooks'

const GROUP_OPTIONS = ['all', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'SPECIAL'] as const

type GroupFilter = (typeof GROUP_OPTIONS)[number]

export function TeamsPage() {
  const seedInit = useInitializeSeed()
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState<GroupFilter>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['teams-overview'],
    enabled: seedInit.isSuccess,
    queryFn: async () => {
      const [teams, stickers, entries] = await Promise.all([
        repository.listTeams(),
        repository.listStickers(),
        repository.listEntries(),
      ])
      return buildTeamProgress(teams, stickers, entries)
    },
  })

  const scrollRestored = useRef(false)

  useEffect(() => {
    const save = () => sessionStorage.setItem('teams-scroll', String(window.scrollY))
    window.addEventListener('scroll', save, { passive: true })
    return () => window.removeEventListener('scroll', save)
  }, [])

  useEffect(() => {
    if (scrollRestored.current || isLoading || !data) return
    const saved = sessionStorage.getItem('teams-scroll')
    if (saved) window.scrollTo(0, Number(saved))
    scrollRestored.current = true
  }, [isLoading, data])

  const filteredTeams = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (data ?? [])
      .filter((item) => {
        const matchesName = item.team.name.toLowerCase().includes(needle)
        const matchesGroup = group === 'all' || item.team.group === group
        return matchesName && matchesGroup
      })
      .sort((left, right) => {
        if (left.team.group !== right.team.group) {
          return left.team.group.localeCompare(right.team.group)
        }
        if (left.team.order !== right.team.order) {
          return left.team.order - right.team.order
        }
        return left.team.name.localeCompare(right.team.name)
      })
  }, [data, group, search])

  return (
    <AppFrame>
      {/* Top bar */}
      <div className="sticky-bar">
        <h1 style={{ flex: 1 }}>TEAMS</h1>
        <span className="nb-tag">{filteredTeams.length}/{data?.length ?? 0}</span>
      </div>

      {/* Search */}
      <div style={{ padding: '14px 18px 8px' }}>
        <input
          className="nb-input"
          placeholder="Search team..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Group chips */}
      <div className="filter-strip">
        {GROUP_OPTIONS.map((g) => (
          <button
            key={g}
            type="button"
            className={`nb-chip${group === g ? ' is-active' : ''}`}
            onClick={() => setGroup(g)}
          >
            {g === 'all' ? 'All groups' : `Group ${g}`}
          </button>
        ))}
      </div>

      {/* Team list */}
      <div style={{ padding: '12px 18px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading && (
          <div className="mono text-sm text-mute" style={{ padding: '20px 0', textAlign: 'center' }}>
            Loading...
          </div>
        )}

        {!isLoading && filteredTeams.length === 0 && (
          <div
            className="nb-card nb-card--white mono text-sm text-mute"
            style={{ padding: 18, textAlign: 'center' }}
          >
            No teams match this filter.
          </div>
        )}

        {filteredTeams.map(({ team, total, collected, missing, duplicateCopies, progress }) => (
          <Link
            key={team.id}
            to={`/teams/${team.id}`}
            className="nb-card nb-card--white"
            style={{ padding: 14, display: 'block' }}
          >
            <div className="row items-center gap-3">
              <div className="flag-box" style={{ width: 48, height: 48 }}>
                <img src={team.flag} alt={`${team.name} flag`} />
              </div>
              <div className="flex-1">
                <div className="row items-center gap-2" style={{ marginBottom: 2 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{team.name}</div>
                  <div className="mono text-xs text-mute">GRP {team.group}</div>
                </div>
                <div className="mono text-xs text-mute">
                  {collected}/{total} · {missing} missing · {duplicateCopies} dupes
                </div>
              </div>
              <div className="display" style={{ fontSize: 22, flexShrink: 0 }}>{progress}%</div>
            </div>
            <div className="nb-progress" style={{ marginTop: 10 }}>
              <span
                className={`nb-progress-fill${progress === 100 ? ' nb-progress-fill--complete' : ''}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </Link>
        ))}
      </div>

      <div style={{ height: 12 }} />
    </AppFrame>
  )
}
