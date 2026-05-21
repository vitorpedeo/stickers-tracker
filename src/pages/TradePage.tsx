import { useQuery } from '@tanstack/react-query'
import { AppFrame } from '../components/AppFrame'
import { repository } from '../data/repositorySingleton'
import { toStickerCopies } from '../domain/progress'
import { useInitializeSeed } from '../features/stickers/hooks'

export function TradePage() {
  const seedInit = useInitializeSeed()

  const { data } = useQuery({
    queryKey: ['trade-view'],
    enabled: seedInit.isSuccess,
    queryFn: async () => {
      const [teams, stickers, entries] = await Promise.all([
        repository.listTeams(),
        repository.listStickers(),
        repository.listEntries(),
      ])

      const entriesById = new Map(entries.map((e) => [e.stickerId, e]))

      type DupeItem = { slot: number; count: number }
      type WantedItem = { teamId: string; slot: number }

      const dupesByTeam = new Map<string, DupeItem[]>()
      const sortedTeams = [...teams].sort((left, right) => {
        if (left.group !== right.group) {
          return left.group.localeCompare(right.group)
        }
        if (left.order !== right.order) {
          return left.order - right.order
        }
        return left.name.localeCompare(right.name)
      })
      const wanted: WantedItem[] = []

      for (const team of sortedTeams) {
        const teamStickers = stickers
          .filter((s) => s.teamId === team.id)
          .sort((a, b) => a.number.localeCompare(b.number))

        teamStickers.forEach((s, idx) => {
          const copies = toStickerCopies(entriesById.get(s.id))
          if (copies >= 2) {
            const existing = dupesByTeam.get(team.id) ?? []
            existing.push({ slot: idx + 1, count: copies - 1 })
            dupesByTeam.set(team.id, existing)
          }
          if (copies === 0) {
            wanted.push({ teamId: team.id, slot: idx + 1 })
          }
        })
      }

      const totalDupes = Array.from(dupesByTeam.values()).reduce(
        (acc, items) => acc + items.reduce((a, d) => a + d.count, 0),
        0,
      )

      const teamsWithDupes = [...Array.from(dupesByTeam.entries())
        .map(([teamId, items]) => ({
          team: teams.find((t) => t.id === teamId)!,
          items,
          total: items.reduce((a, d) => a + d.count, 0),
        }))
        .filter((x) => x.team)].sort((a, b) => b.total - a.total)

      return { teamsWithDupes, wanted, totalDupes }
    },
  })

  const { teamsWithDupes = [], wanted = [], totalDupes = 0 } = data ?? {}

  return (
    <AppFrame>
      {/* Top bar */}
      <div className="sticky-bar">
        <h1 className="flex-1">DOUBLES</h1>
        <span className="nb-tag nb-tag--red">{totalDupes} TO TRADE</span>
      </div>

      {/* Trade pile hero */}
      <div style={{ padding: '14px 18px 8px' }}>
        <div className="nb-card nb-card--pink" style={{ padding: 16 }}>
          <div className="row between items-center">
            <div>
              <div className="mono uc text-xs text-mute">Trade pile</div>
              <div className="display" style={{ fontSize: 40, marginTop: 4 }}>{totalDupes}</div>
              <div className="mono text-xs text-mute" style={{ marginTop: 2 }}>
                ACROSS {teamsWithDupes.length} TEAMS
              </div>
            </div>
            <div
              className="display"
              style={{ fontSize: 52, lineHeight: 1, WebkitTextStroke: '3px #0B0B0F', color: 'transparent' }}
            >
              ⇆
            </div>
          </div>
        </div>
      </div>

      {/* Your doubles */}
      {teamsWithDupes.length > 0 && (
        <>
          <div className="section-head">
            <h2 className="section-title">YOUR DOUBLES</h2>
          </div>
          <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {teamsWithDupes.map(({ team, items, total }) => (
              <div key={team.id} className="nb-card nb-card--white" style={{ padding: 12 }}>
                <div className="row items-center gap-3" style={{ marginBottom: 8 }}>
                  <div className="flag-box" style={{ width: 38, height: 38, borderRadius: 8 }}>
                    <img src={team.flag} alt={team.name} />
                  </div>
                  <div className="flex-1" style={{ fontWeight: 800, fontSize: 14 }}>{team.name}</div>
                  <span className="nb-tag nb-tag--red">{total}</span>
                </div>
                <div className="row wrap gap-2">
                  {items.map((d, i) => (
                    <div
                      key={i}
                      className="mono"
                      style={{
                        padding: '3px 7px',
                        border: '2px solid #0B0B0F',
                        borderRadius: 6,
                        background: '#FFD43A',
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      #{String(d.slot).padStart(2, '0')}{d.count > 1 ? ` ×${d.count}` : ''}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Still wanted */}
      {wanted.length > 0 && (
        <>
          <div className="section-head">
            <h2 className="section-title">STILL WANTED</h2>
            <span className="mono text-xs text-mute">{wanted.length} stickers</span>
          </div>
          <div style={{ padding: '0 18px' }}>
            <div className="nb-card nb-card--white" style={{ padding: 12 }}>
              <div className="row wrap gap-2">
                {wanted.slice(0, 32).map((w, i) => {
                  const teamCode = w.teamId.split('-')[0]?.toUpperCase().slice(0, 3) ?? w.teamId.slice(0, 3).toUpperCase()
                  return (
                    <div
                      key={i}
                      className="mono"
                      style={{
                        padding: '5px 9px',
                        border: '2px solid #0B0B0F',
                        borderRadius: 6,
                        background: '#F1E6C7',
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {teamCode} #{String(w.slot).padStart(2, '0')}
                    </div>
                  )
                })}
                {wanted.length > 32 && (
                  <div className="mono text-xs text-mute" style={{ width: '100%', marginTop: 4 }}>
                    +{wanted.length - 32} more
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {teamsWithDupes.length === 0 && (
        <div style={{ padding: '40px 18px', textAlign: 'center' }}>
          <div className="display" style={{ fontSize: 28, opacity: 0.3 }}>NO DOUBLES YET</div>
          <div className="mono text-xs text-mute" style={{ marginTop: 8 }}>
            Tap stickers twice to mark as duplicate
          </div>
        </div>
      )}

      <div style={{ height: 12 }} />
    </AppFrame>
  )
}
