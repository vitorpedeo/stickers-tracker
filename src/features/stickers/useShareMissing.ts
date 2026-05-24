import { useEffect, useRef, useState } from 'react'
import { repository } from '../../data/repositorySingleton'
import { buildMissingByTeam } from '../../domain/share'
import type { MissingByTeam } from '../../domain/share'

function formatMissingText(grouped: MissingByTeam[]): string {
  if (grouped.length === 0) {
    return 'All stickers collected! 🎉'
  }

  return grouped
    .map(({ team, missingNumbers }) => {
      const numbers = missingNumbers.map((n) => `#${n}`).join(', ')
      return `${team.name}: ${numbers}`
    })
    .join('\n')
}

export function useShareMissing(teamId?: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current)
      }
    }
  }, [])

  const share = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [teams, stickers, entries] = await Promise.all([
        repository.listTeams(),
        repository.listStickers(),
        repository.listEntries(),
      ])

      const grouped = buildMissingByTeam(teams, stickers, entries, teamId)
      const text = formatMissingText(grouped)

      if (navigator.share) {
        await navigator.share({ text })
      } else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setIsLoading(false)
    }
  }

  return { share, isLoading, copied, error }
}
