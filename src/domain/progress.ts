import type { CollectionEntry, Sticker, Team } from './types'

export type TeamProgress = {
  team: Team
  total: number
  collected: number
  missing: number
  duplicateCopies: number
  progress: number
}

export type AlbumProgress = {
  total: number
  collected: number
  missing: number
  duplicateCopies: number
  completion: number
  updatedAt: number | null
}

export function toStickerCopies(entry: CollectionEntry | undefined): number {
  if (!entry || entry.status === 'missing') {
    return 0
  }

  return 1 + Math.max(0, entry.duplicateCount)
}

export function fromStickerCopies(copies: number) {
  if (copies <= 0) {
    return {
      status: 'missing' as const,
      duplicateCount: 0,
    }
  }

  return {
    status: 'collected' as const,
    duplicateCount: Math.max(0, copies - 1),
  }
}

export function buildTeamProgress(
  teams: Team[],
  stickers: Sticker[],
  entries: CollectionEntry[],
): TeamProgress[] {
  const entriesById = new Map(entries.map((entry) => [entry.stickerId, entry]))

  return teams
    .map((team) => {
      const teamStickers = stickers.filter((sticker) => sticker.teamId === team.id)
      const total = teamStickers.length

      let collected = 0
      let duplicateCopies = 0

      for (const sticker of teamStickers) {
        const copies = toStickerCopies(entriesById.get(sticker.id))

        if (copies > 0) {
          collected += 1
        }

        duplicateCopies += Math.max(0, copies - 1)
      }

      const missing = total - collected
      const progress = total === 0 ? 0 : Math.round((collected / total) * 100)

      return {
        team,
        total,
        collected,
        missing,
        duplicateCopies,
        progress,
      }
    })
    .sort((left, right) => left.team.order - right.team.order)
}

export function summarizeAlbum(
  teams: Team[],
  stickers: Sticker[],
  entries: CollectionEntry[],
): AlbumProgress {
  const teamsSummary = buildTeamProgress(teams, stickers, entries)

  const total = teamsSummary.reduce((acc, item) => acc + item.total, 0)
  const collected = teamsSummary.reduce((acc, item) => acc + item.collected, 0)
  const duplicateCopies = teamsSummary.reduce(
    (acc, item) => acc + item.duplicateCopies,
    0,
  )
  const missing = total - collected
  const completion = total === 0 ? 0 : Math.round((collected / total) * 100)

  const updatedAtValues = entries
    .map((entry) => Date.parse(entry.updatedAt))
    .filter((value) => !Number.isNaN(value))

  return {
    total,
    collected,
    missing,
    duplicateCopies,
    completion,
    updatedAt: updatedAtValues.length > 0 ? Math.max(...updatedAtValues) : null,
  }
}
