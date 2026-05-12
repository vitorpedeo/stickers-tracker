import { useQuery } from '@tanstack/react-query'
import { AppFrame } from '../components/AppFrame'
import { repository } from '../data/repositorySingleton'
import { TradePanel } from '../features/trade/TradePanel'
import { useInitializeSeed } from '../features/stickers/hooks'

export function TradePage() {
  const seedInit = useInitializeSeed()
  const { data } = useQuery({
    queryKey: ['trade-view'],
    enabled: seedInit.isSuccess,
    queryFn: async () => {
      const [stickers, entries] = await Promise.all([
        repository.listStickers(),
        repository.listEntries(),
      ])

      const entriesById = new Map(entries.map((entry) => [entry.stickerId, entry]))

      const duplicates = stickers
        .map((sticker) => {
          const entry = entriesById.get(sticker.id)
          return {
            stickerId: sticker.id,
            label: `${sticker.number} ${sticker.name}`,
            duplicateCount: entry?.duplicateCount ?? 0,
          }
        })
        .filter((item) => item.duplicateCount > 0)
        .sort((left, right) => right.duplicateCount - left.duplicateCount)

      const wanted = stickers
        .filter((sticker) => (entriesById.get(sticker.id)?.status ?? 'missing') === 'missing')
        .map((sticker) => ({
          stickerId: sticker.id,
          label: `${sticker.number} ${sticker.name}`,
        }))

      return { duplicates, wanted }
    },
  })

  return (
    <AppFrame title="Trade">
      <TradePanel duplicates={data?.duplicates ?? []} wanted={data?.wanted ?? []} />
    </AppFrame>
  )
}
