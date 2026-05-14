import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppFrame } from '../components/AppFrame'
import { repository } from '../data/repositorySingleton'
import { buildTeamProgress } from '../domain/progress'
import { useInitializeSeed } from '../features/stickers/hooks'

const GROUP_OPTIONS = ['all', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const

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
      <section className="page-head">
        <div>
          <h1 className="page-title">Teams</h1>
          <p className="page-subtitle">Search teams or narrow by group to open sticker sheets.</p>
        </div>
        <span className="chip">{data?.length ?? 0} teams</span>
      </section>

      <section className="panel filters-panel">
        <label className="field-label" htmlFor="team-search">
          Search
        </label>
        <input
          id="team-search"
          className="field-input"
          placeholder="Search by team name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <label className="field-label" htmlFor="group-filter">
          Group
        </label>
        <select
          id="group-filter"
          className="field-select"
          value={group}
          onChange={(event) => setGroup(event.target.value as GroupFilter)}
        >
          {GROUP_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value === 'all' ? 'All groups' : `Group ${value}`}
            </option>
          ))}
        </select>
      </section>

      {isLoading ? <p className="meta-line">Loading teams...</p> : null}

      <section className="team-list" aria-label="Teams list">
        {filteredTeams.map((item) => (
          <Link key={item.team.id} className="panel team-row" to={`/teams/${item.team.id}`}>
            <div className="team-row-identity">
              <img className="team-flag" src={item.team.flag} alt={`${item.team.name} flag`} />
              <div>
                <h2>{item.team.name}</h2>
                <p>Group {item.team.group}</p>
              </div>
            </div>

            <div className="team-row-metrics">
              <p>
                {item.collected}/{item.total} collected
              </p>
              <p>
                {item.missing} missing · {item.duplicateCopies} dupes
              </p>
            </div>

            <div className="progress-track" aria-hidden="true">
              <span className="progress-fill" style={{ width: `${item.progress}%` }} />
            </div>
          </Link>
        ))}

        {!isLoading && filteredTeams.length === 0 ? (
          <p className="panel empty-state">No teams match this filter.</p>
        ) : null}
      </section>
    </AppFrame>
  )
}
