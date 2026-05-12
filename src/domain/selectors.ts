import type { CollectionEntry, Sticker } from './types'

export type CollectionSummary = {
  collected: number
  missing: number
  duplicates: number
  completion: string
}

export function summarizeCollection(
  stickers: Sticker[],
  entries: CollectionEntry[],
): CollectionSummary {
  const byId = new Map(entries.map((entry) => [entry.stickerId, entry]))
  const total = stickers.length

  let collected = 0
  let duplicates = 0

  for (const sticker of stickers) {
    const entry = byId.get(sticker.id)

    if (entry?.status === 'collected') {
      collected += 1
    }

    if (entry) {
      duplicates += entry.duplicateCount
    }
  }

  const missing = total - collected
  const completion = total === 0 ? '0%' : `${Math.round((collected / total) * 100)}%`

  return { collected, missing, duplicates, completion }
}
