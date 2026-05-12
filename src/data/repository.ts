import type { CollectionEntry, SeedBundle, StickerStatus } from '../domain/types'
import { CURRENT_SEED_VERSION } from './migrations'
import { StickerTrackerDb } from './db'

type StickerPatch = Partial<
  Pick<CollectionEntry, 'status' | 'duplicateCount' | 'needNote'>
>

type Repository = {
  resetDatabase: () => Promise<void>
  seed: (bundle: SeedBundle) => Promise<void>
  getEntry: (stickerId: string) => Promise<CollectionEntry | undefined>
  updateSticker: (stickerId: string, patch: StickerPatch) => Promise<CollectionEntry>
  listStickers: () => Promise<SeedBundle['stickers']>
  listEntries: () => Promise<CollectionEntry[]>
}

const nowIso = () => new Date().toISOString()

export function createRepository(): Repository {
  let db = new StickerTrackerDb()

  return {
    async resetDatabase() {
      await db.delete()
      db = new StickerTrackerDb()
    },

    async seed(bundle) {
      await db.transaction('rw', db.teams, db.stickers, db.meta, async () => {
        await db.teams.bulkPut(bundle.teams)
        await db.stickers.bulkPut(bundle.stickers)
        await db.meta.put({ key: 'seedVersion', value: CURRENT_SEED_VERSION })
      })
    },

    async getEntry(stickerId) {
      return db.entries.get(stickerId)
    },

    async listStickers() {
      return db.stickers.toArray()
    },

    async listEntries() {
      return db.entries.toArray()
    },

    async updateSticker(stickerId, patch) {
      const current = await db.entries.get(stickerId)
      const nextStatus: StickerStatus = patch.status ?? current?.status ?? 'missing'
      const nextDuplicateCount = Math.max(
        0,
        patch.duplicateCount ?? current?.duplicateCount ?? 0,
      )

      const entry: CollectionEntry = {
        stickerId,
        status: nextStatus,
        duplicateCount: nextStatus === 'missing' ? 0 : nextDuplicateCount,
        needNote: patch.needNote ?? current?.needNote ?? '',
        updatedAt: nowIso(),
      }

      await db.entries.put(entry)
      return entry
    },
  }
}
