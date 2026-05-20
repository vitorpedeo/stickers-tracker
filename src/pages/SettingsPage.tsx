import { useQuery } from '@tanstack/react-query'
import { AppFrame } from '../components/AppFrame'
import { repository } from '../data/repositorySingleton'
import { buildInitialCollection } from '../domain/seed'
import { summarizeAlbum } from '../domain/progress'
import { teams2026 } from '../domain/teams2026'
import { useInitializeSeed } from '../features/stickers/hooks'

function formatLastUpdate(updatedAt: number | null) {
  if (!updatedAt) return 'Never updated'
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(updatedAt))
}

function downloadFile(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function SettingsPage() {
  const seedInit = useInitializeSeed()

  const { data, refetch } = useQuery({
    queryKey: ['settings-view'],
    enabled: seedInit.isSuccess,
    queryFn: async () => {
      const [teams, stickers, entries] = await Promise.all([
        repository.listTeams(),
        repository.listStickers(),
        repository.listEntries(),
      ])
      return { teams, stickers, entries, summary: summarizeAlbum(teams, stickers, entries) }
    },
  })

  function buildStickerRows() {
    if (!data) return []
    const entriesById = new Map(data.entries.map((e) => [e.stickerId, e]))
    const teamOrder = new Map(teams2026.map((t, i) => [t.id, i]))
    const sortedTeams = [...data.teams].sort(
      (a, b) => (teamOrder.get(a.id) ?? 999) - (teamOrder.get(b.id) ?? 999),
    )
    const rows: { sticker_id: string; status: string; duplicateCount: number }[] = []

    for (const team of sortedTeams) {
      const ts = data.stickers
        .filter((s) => s.teamId === team.id)
        .sort((a, b) => Number(a.number.split('-').at(-1)) - Number(b.number.split('-').at(-1)))

      for (const s of ts) {
        const entry = entriesById.get(s.id)
        rows.push({
          sticker_id: s.id,
          status: entry?.status ?? 'missing',
          duplicateCount: entry?.duplicateCount ?? 0,
        })
      }
    }

    return rows
  }

  const exportJson = () => {
    if (!data) return
    downloadFile(
      JSON.stringify(buildStickerRows(), null, 2),
      'world-cup-2026-stickers.json',
      'application/json',
    )
  }

  const exportCsv = () => {
    if (!data) return
    const rows = ['sticker_id,status,duplicateCount']
    for (const row of buildStickerRows()) {
      rows.push(`${row.sticker_id},${row.status},${row.duplicateCount}`)
    }
    downloadFile(rows.join('\n'), 'world-cup-2026-stickers.csv', 'text/csv;charset=utf-8')
  }

  const resetLocalData = async () => {
    const confirmed = window.confirm(
      'Reset local sticker data? This will clear your progress on this device.',
    )
    if (!confirmed) return
    await repository.resetDatabase()
    await repository.seed(buildInitialCollection())
    await refetch()
    window.location.reload()
  }

  const summary = data?.summary

  return (
    <AppFrame>
      {/* Top bar */}
      <div className="sticky-bar">
        <h1>SETTINGS</h1>
      </div>

      {/* Save status card */}
      <div style={{ padding: '14px 18px 8px' }}>
        <div className="nb-card nb-card--mint" style={{ padding: 16 }}>
          <div className="mono uc text-xs text-mute">Local save</div>
          <div className="display" style={{ fontSize: 32, marginTop: 6 }}>
            {summary?.collected ?? 0}/{summary?.total ?? 0}
          </div>
          <div className="mono text-xs text-mute" style={{ marginTop: 4 }}>
            UPDATED · {formatLastUpdate(summary?.updatedAt ?? null).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="section-head">
        <h2 className="section-title">EXPORT</h2>
      </div>
      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button type="button" className="nb-btn nb-btn--yellow nb-btn--block" onClick={exportJson}>
          <span>Export as JSON</span><span className="mono">▸</span>
        </button>
        <button type="button" className="nb-btn nb-btn--block" onClick={exportCsv}>
          <span>Export as CSV</span><span className="mono">▸</span>
        </button>
      </div>

      {/* Preferences */}
      <div className="section-head" style={{ marginTop: 6 }}>
        <h2 className="section-title">PREFERENCES</h2>
      </div>
      <div style={{ padding: '0 18px' }}>
        <div className="nb-card nb-card--white" style={{ padding: '4px 0' }}>
          {[
            { label: 'Stickers per team', value: String(summary?.total ? Math.round(summary.total / (data?.teams.length ?? 1)) : 20) },
            { label: 'Default tap action', value: 'Mark got' },
            { label: 'Long-press action',  value: 'Clear sticker' },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className="row items-center between"
              style={{
                padding: '12px 14px',
                borderBottom: i < arr.length - 1 ? '2px dashed rgba(11,11,15,0.15)' : 'none',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14 }}>{row.label}</div>
              <div
                className="mono"
                style={{
                  fontSize: 12,
                  background: '#FFD43A',
                  border: '2px solid #0B0B0F',
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontWeight: 800,
                }}
              >
                {row.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger */}
      <div className="section-head" style={{ marginTop: 6 }}>
        <h2 className="section-title">DANGER ZONE</h2>
      </div>
      <div style={{ padding: '0 18px 30px' }}>
        <button
          type="button"
          className="nb-btn nb-btn--red"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => void resetLocalData()}
        >
          Reset local data
        </button>
      </div>
    </AppFrame>
  )
}
