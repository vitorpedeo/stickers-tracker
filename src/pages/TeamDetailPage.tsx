import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppFrame } from '../components/AppFrame'
import { repository } from '../data/repositorySingleton'
import { FilterDock, type StickerFilter } from '../features/stickers/FilterDock'
import { StickerTile } from '../features/stickers/StickerTile'

export function TeamDetailPage() {
  const { teamId } = useParams()
  const [filter, setFilter] = useState<StickerFilter>('all')

  const teamStickersQuery = useQuery({
    queryKey: ['team-stickers', teamId],
    queryFn: async () => {
      const stickers = await repository.listStickers()
      return stickers
        .filter((sticker) => (teamId ? sticker.teamId === teamId : sticker.teamId !== null))
        .sort((left, right) => left.number.localeCompare(right.number))
    },
  })

  const entriesQuery = useQuery({
    queryKey: ['entries'],
    queryFn: () => repository.listEntries(),
  })

  const entriesById = useMemo(
    () => new Map((entriesQuery.data ?? []).map((entry) => [entry.stickerId, entry])),
    [entriesQuery.data],
  )

  const visibleStickers = useMemo(() => {
    const stickers = teamStickersQuery.data ?? []

    if (filter === 'all') {
      return stickers
    }

    return stickers.filter((sticker) => {
      const status = entriesById.get(sticker.id)?.status ?? 'missing'
      return status === filter
    })
  }, [entriesById, filter, teamStickersQuery.data])

  return (
    <AppFrame title="Team">
      <FilterDock value={filter} onChange={setFilter} />
      {teamStickersQuery.isLoading ? <p>Loading stickers…</p> : null}
      {!teamStickersQuery.isLoading && visibleStickers.length === 0 ? (
        <p>No stickers match this filter.</p>
      ) : null}
      <div className="team-sticker-grid">
        {visibleStickers.map((sticker) => (
          <StickerTile
            key={sticker.id}
            stickerId={sticker.id}
            number={sticker.number}
            name={sticker.name}
          />
        ))}
      </div>
    </AppFrame>
  )
}
