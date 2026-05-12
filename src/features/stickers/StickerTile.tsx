import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { repository } from '../../data/repositorySingleton'
import type { StickerStatus } from '../../domain/types'
import { NeedNoteEditor } from './NeedNoteEditor'
import { StatusSwitch } from './StatusSwitch'

type StickerTileProps = {
  stickerId: string
  number: string
  name: string
}

type StickerPatch = {
  status?: StickerStatus
  duplicateCount?: number
  needNote?: string
}

export function StickerTile({ stickerId, number, name }: StickerTileProps) {
  const queryClient = useQueryClient()

  const { data: entry } = useQuery({
    queryKey: ['entry', stickerId],
    queryFn: async () => (await repository.getEntry(stickerId)) ?? null,
  })

  const mutation = useMutation({
    mutationFn: (patch: StickerPatch) => repository.updateSticker(stickerId, patch),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['entry', stickerId] }),
        queryClient.invalidateQueries({ queryKey: ['entries'] }),
        queryClient.invalidateQueries({ queryKey: ['summary'] }),
      ])
    },
  })

  const status: StickerStatus = entry?.status ?? 'missing'
  const duplicates = entry?.duplicateCount ?? 0
  const note = entry?.needNote ?? ''

  return (
    <article className="sticker-tile" aria-label={`Sticker ${number}`}>
      <h3>{number}</h3>
      <p>{name}</p>
      <StatusSwitch status={status} onChange={(next) => mutation.mutate({ status: next })} />
      <button
        type="button"
        aria-label="Increase duplicates"
        onClick={() => mutation.mutate({ status: 'collected', duplicateCount: duplicates + 1 })}
        disabled={status === 'missing' || mutation.isPending}
      >
        +
      </button>
      <p>Duplicates: {duplicates}</p>
      <NeedNoteEditor value={note} onChange={(next) => mutation.mutate({ needNote: next })} />
    </article>
  )
}
