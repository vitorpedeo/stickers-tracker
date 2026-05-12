import { useQuery, useQueryClient } from '@tanstack/react-query'
import { repository } from '../../data/repositorySingleton'
import { buildInitialCollection } from '../../domain/seed'
import { summarizeCollection } from '../../domain/selectors'

export function useInitializeSeed() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['seed-init'],
    queryFn: async () => {
      const reseeded = await repository.initializeSeed(buildInitialCollection())

      if (reseeded) {
        await queryClient.invalidateQueries({ queryKey: ['summary'] })
      }

      return true
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })
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
  })
}

export function useTeams(enabled: boolean) {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => repository.listTeams(),
    enabled,
  })
}
