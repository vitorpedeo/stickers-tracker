import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { repository } from '../data/repositorySingleton'
import { buildTeamProgress, summarizeAlbum } from '../domain/progress'
import type { TeamGroup } from '../domain/types'
import { useInitializeSeed } from '../features/stickers/hooks'
import { useGeneratePdf } from '../features/stickers/useGeneratePdf'

const GROUPS: TeamGroup[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
const GROUP_COLORS = ['#FFD43A', '#8FE0B5', '#FFB7C7', '#4FB3FF']

function ProgressRing({
  pct,
  size = 84,
  stroke = 10,
}: {
  pct: number
  size?: number
  stroke?: number
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c - (pct / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="#fff" stroke="#0B0B0F" strokeWidth="3" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#E83838"
        strokeWidth={stroke}
        strokeLinecap="butt"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dy="2"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="Archivo Black"
        fontSize={size / 3.4}
        fill="#0B0B0F"
      >
        {pct}%
      </text>
    </svg>
  )
}

export function DashboardPage() {
  const seedInit = useInitializeSeed()
  const navigate = useNavigate()
  const { generate, isLoading, error } = useGeneratePdf()

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

      const closest = teamProgress
        .filter((x) => x.missing > 0 && x.missing <= 8)
        .sort((a, b) => a.missing - b.missing)
        .slice(0, 3)

      return { album, groupProgress, closest }
    },
  })

  const album = data?.album
  const pct = album?.completion ?? 0

  return (
    <>
      {/* Top bar */}
      <div className="sticky-bar">
        <h1 style={{ flex: 1 }}>ALBUM</h1>
        {error && (
          <span className="mono text-xs" style={{ color: 'var(--bg-red)' }}>
            PDF failed
          </span>
        )}
        <button
          type="button"
          className="nb-chip"
          onClick={generate}
          disabled={isLoading}
        >
          {isLoading ? 'BUILDING PDF...' : 'DOWNLOAD PDF'}
        </button>
      </div>

      {/* Progress hero card */}
      <div style={{ padding: '8px 18px' }}>
        <div className="nb-card nb-card--yellow" style={{ padding: 18 }}>
          <div className="row items-center between" style={{ marginBottom: 12, gap: 16 }}>
            <div>
              <div className="mono uc text-xs" style={{ opacity: 0.7 }}>Album completion</div>
              <div className="display" style={{ fontSize: 52, marginTop: 2 }}>{pct}%</div>
            </div>
            <ProgressRing pct={pct} />
          </div>
          <div className="nb-progress" style={{ marginBottom: 12 }}>
            <span
              className="nb-progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="row gap-2 wrap">
            <span className="nb-tag">{album?.collected ?? 0} got</span>
            <span className="nb-tag nb-tag--white">{album?.missing ?? 0} missing</span>
            <span className="nb-tag nb-tag--red">{album?.duplicateCopies ?? 0} dupes</span>
          </div>
        </div>
      </div>

      {/* Closest to done */}
      {(data?.closest?.length ?? 0) > 0 && (
        <>
          <div className="section-head">
            <h2 className="section-title">CLOSEST TO DONE</h2>
            <span className="mono text-xs text-mute">Top 3</span>
          </div>
          <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data!.closest.map(({ team, missing, collected, total }) => (
              <div
                key={team.id}
                className="nb-card nb-card--white"
                style={{ padding: '12px 14px', cursor: 'pointer' }}
                onClick={() => navigate(`/teams/${team.id}`)}
              >
                <div className="row items-center gap-3">
                  <div
                    className="flag-box"
                    style={{ width: 42, height: 42, borderRadius: 10 }}
                  >
                    <img src={team.flag} alt={team.name} />
                  </div>
                  <div className="flex-1">
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{team.name}</div>
                    <div className="mono text-xs text-mute">
                      {collected}/{total} · GROUP {team.group}
                    </div>
                  </div>
                  <span className="nb-tag nb-tag--red">{missing} LEFT</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Group grid */}
      <div className="section-head">
        <h2 className="section-title">GROUPS</h2>
      </div>
      <div style={{ padding: '0 18px' }}>
        <div className="group-grid">
          {(data?.groupProgress ?? []).map((item, i) => (
            <div
              key={item.group}
              className="group-cell"
              style={{ background: GROUP_COLORS[i % 4] }}
            >
              <div className="display" style={{ fontSize: 20 }}>{item.group}</div>
              <div className="mono" style={{ fontSize: 11, marginTop: 2 }}>{item.progress}%</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 20 }} />
    </>
  )
}
