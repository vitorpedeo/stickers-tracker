import { AppFrame } from '../components/AppFrame'
import { teams2026 } from '../domain/teams2026'
import { Link } from 'react-router-dom'
import { useInitializeSeed, useTeams } from '../features/stickers/hooks'

export function TeamsPage() {
  const seedInit = useInitializeSeed()
  const teamsQuery = useTeams(seedInit.isSuccess)
  const teams = teamsQuery.data && teamsQuery.data.length > 0 ? teamsQuery.data : teams2026

  return (
    <AppFrame title="Teams">
      <p className="page-lead">
        Browse every qualified national team and jump straight into each sticker set.
      </p>
      {teamsQuery.isLoading ? <p>Syncing local team data…</p> : null}
      <div className="teams-grid">
        {teams.map((team) => (
          <Link key={team.id} className="team-card" to={`/teams/${team.id}`}>
            <p className="team-card-group">Group {team.group}</p>
            <p className="team-card-flag" aria-label={`${team.name} flag`}>
              {team.flag}
            </p>
            <h3 className="team-card-name">{team.name}</h3>
          </Link>
        ))}
      </div>
    </AppFrame>
  )
}
