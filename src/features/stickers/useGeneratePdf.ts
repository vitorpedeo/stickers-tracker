import { createElement, useRef, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { repository } from '../../data/repositorySingleton'
import { buildMissingByTeam } from '../../domain/share'
import { WantlistDocument } from './WantlistPdf'
import type { WantlistTeamData } from './WantlistPdf'

function formatDate(date: Date): string {
  return date
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase()
}

export function useGeneratePdf() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const inFlightRef = useRef(false)

  const generate = async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      const [teams, stickers, entries] = await Promise.all([
        repository.listTeams(),
        repository.listStickers(),
        repository.listEntries(),
      ])

      const missing = buildMissingByTeam(teams, stickers, entries)
      if (missing.length === 0) return

      const stickersByTeam = new Map<string, number>()
      for (const sticker of stickers) {
        if (sticker.teamId) {
          stickersByTeam.set(sticker.teamId, (stickersByTeam.get(sticker.teamId) ?? 0) + 1)
        }
      }

      const pdfTeams: WantlistTeamData[] = missing.map(({ team, missingNumbers }) => ({
        team,
        total: stickersByTeam.get(team.id) ?? 0,
        missingNumbers,
      }))

      const blob = await pdf(
        createElement(WantlistDocument, { teams: pdfTeams, generatedDate: formatDate(new Date()) }),
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'stickers-wantlist.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      inFlightRef.current = false
      setIsLoading(false)
    }
  }

  return { generate, isLoading, error }
}
