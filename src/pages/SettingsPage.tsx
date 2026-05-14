import { useQuery } from '@tanstack/react-query'
import { AppFrame } from '../components/AppFrame'
import { repository } from '../data/repositorySingleton'
import { buildInitialCollection } from '../domain/seed'
import { summarizeAlbum, toStickerCopies } from '../domain/progress'
import { useInitializeSeed } from '../features/stickers/hooks'

function formatLastUpdate(updatedAt: number | null) {
  if (!updatedAt) {
    return 'No sticker updates yet.'
  }

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

      return {
        teams,
        stickers,
        entries,
        summary: summarizeAlbum(teams, stickers, entries),
      }
    },
  })

  const exportJson = () => {
    if (!data) {
      return
    }

    const entriesById = new Map(data.entries.map((entry) => [entry.stickerId, entry]))

    const stickersByTeam = data.teams.reduce<Record<string, number[]>>((acc, team) => {
      const teamStickers = data.stickers
        .filter((sticker) => sticker.teamId === team.id)
        .sort((left, right) => left.number.localeCompare(right.number))

      acc[team.id] = teamStickers.map((sticker) => toStickerCopies(entriesById.get(sticker.id)))
      return acc
    }, {})

    const payload = {
      edition: 'FIFA World Cup 2026',
      teams: data.teams.map((team) => ({
        id: team.id,
        name: team.name,
        flag: team.flag,
        group: team.group,
      })),
      stickers: stickersByTeam,
      updatedAt: data.summary.updatedAt ?? Date.now(),
    }

    downloadFile(
      JSON.stringify(payload, null, 2),
      'world-cup-2026-stickers.json',
      'application/json',
    )
  }

  const exportCsv = () => {
    if (!data) {
      return
    }

    const entriesById = new Map(data.entries.map((entry) => [entry.stickerId, entry]))
    const rows = ['team,group,sticker_number,copies,state']

    for (const team of data.teams) {
      const teamStickers = data.stickers
        .filter((sticker) => sticker.teamId === team.id)
        .sort((left, right) => left.number.localeCompare(right.number))

      for (const sticker of teamStickers) {
        const slot = Number(sticker.number.split('-').at(-1))
        const copies = toStickerCopies(entriesById.get(sticker.id))
        const state = copies === 0 ? 'missing' : copies === 1 ? 'collected' : 'duplicate'

        rows.push(`${team.name},${team.group},${slot},${copies},${state}`)
      }
    }

    downloadFile(rows.join('\n'), 'world-cup-2026-stickers.csv', 'text/csv;charset=utf-8')
  }

  const resetLocalData = async () => {
    const confirmed = window.confirm(
      'Reset local sticker data? This will clear your progress on this device.',
    )

    if (!confirmed) {
      return
    }

    await repository.resetDatabase()
    await repository.seed(buildInitialCollection())
    await refetch()
    window.location.reload()
  }

  return (
    <AppFrame>
      <section className="page-head">
        <div>
          <h1 className="page-title">Settings & Export</h1>
          <p className="page-subtitle">Your album data is saved locally on this device.</p>
        </div>
      </section>

      <section className="panel settings-panel">
        <p className="meta-line">
          {data?.summary.collected ?? 0}/{data?.summary.total ?? 0} collected ·{' '}
          {data?.summary.duplicateCopies ?? 0} dupes · updated{' '}
          {formatLastUpdate(data?.summary.updatedAt ?? null)}
        </p>

        <div className="settings-actions">
          <button type="button" className="btn btn-primary" onClick={exportJson}>
            Export JSON
          </button>
          <button type="button" className="btn" onClick={exportCsv}>
            Export CSV
          </button>
          <button type="button" className="btn btn-danger" onClick={() => void resetLocalData()}>
            Reset local data
          </button>
        </div>
      </section>
    </AppFrame>
  )
}
