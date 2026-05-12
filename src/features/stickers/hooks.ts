import { useQuery } from '@tanstack/react-query'
import { queryClient } from '../../app/queryClient'
import { repository } from '../../data/repositorySingleton'
import { buildInitialCollection } from '../../domain/seed'
import { summarizeCollection } from '../../domain/selectors'

export function useInitializeSeed() {
  return useQuery({
    queryKey: ['seed-init'],
    queryFn: async () => {
      const stickers = await repository.listStickers()

      if (stickers.length === 0) {
        await repository.seed(buildInitialCollection())
      }

      return true
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  }, queryClient)
}

export function useDashboardSummary(enabled: boolean) {
  return useQuery({
    queryKey: ['summary'],
    queryFn: async () => {
      const stickers = await repository.listStickers()
      const entries = await repository.listEntries()
      return summarizeCollection(stickers, entries)
    },
    enabled,
  }, queryClient)
}
