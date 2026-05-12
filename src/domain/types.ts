export type StickerStatus = 'missing' | 'collected'

export type Team = {
  id: string
  name: string
  group: string
  order: number
}

export type StickerCategory = 'team' | 'special'

export type Sticker = {
  id: string
  teamId: string | null
  number: string
  name: string
  category: StickerCategory
}

export type CollectionEntry = {
  stickerId: string
  status: StickerStatus
  duplicateCount: number
  needNote: string
  updatedAt: string
}

export type SeedBundle = {
  teams: Team[]
  stickers: Sticker[]
}
