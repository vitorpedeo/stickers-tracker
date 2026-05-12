import type { CollectionEntry, SeedBundle, StickerStatus } from '../domain/types'
import { CURRENT_SEED_VERSION, shouldReseed } from './migrations'
import { StickerTrackerDb } from './db'

type StickerPatch = Partial<
  Pick<CollectionEntry, 'status' | 'duplicateCount' | 'needNote'>
>

type Repository = {
  resetDatabase: () => Promise<void>
  seed: (bundle: SeedBundle) => Promise<void>
  reseed: (bundle: SeedBundle) => Promise<void>
  getSeedVersion: () => Promise<string | undefined>
  getEntry: (stickerId: string) => Promise<CollectionEntry | undefined>
  updateSticker: (stickerId: string, patch: StickerPatch) => Promise<CollectionEntry>
  listTeams: () => Promise<SeedBundle['teams']>
  listStickers: () => Promise<SeedBundle['stickers']>
  listEntries: () => Promise<CollectionEntry[]>
  initializeSeed: (bundle: SeedBundle) => Promise<boolean>
}

const nowIso = () => new Date().toISOString()

export function createRepository(): Repository {
  let db = new StickerTrackerDb()
  const runReseed = async (bundle: SeedBundle) => {
    await db.transaction(
      'rw',
      db.teams,
      db.stickers,
      db.entries,
      db.meta,
      async () => {
        await db.entries.clear()
        await db.stickers.clear()
        await db.teams.clear()
        await db.teams.bulkPut(bundle.teams)
        await db.stickers.bulkPut(bundle.stickers)
        await db.meta.put({ key: 'seedVersion', value: CURRENT_SEED_VERSION })
      },
    )
  }

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

    async reseed(bundle) {
      await runReseed(bundle)
    },

    async getSeedVersion() {
      const meta = await db.meta.get('seedVersion')
      return meta?.value
    },

    async getEntry(stickerId) {
      return db.entries.get(stickerId)
    },

    async listStickers() {
      return db.stickers.toArray()
    },

    async listTeams() {
      return db.teams.orderBy('order').toArray()
    },

    async listEntries() {
      return db.entries.toArray()
    },

    async initializeSeed(bundle) {
      const [stickers, seedVersion] = await Promise.all([
        db.stickers.toArray(),
        db.meta.get('seedVersion'),
      ])

      const needsReseed =
        stickers.length === 0 || shouldReseed(seedVersion?.value)

      if (needsReseed) {
        await runReseed(bundle)
      }

      return needsReseed
    },

    async updateSticker(stickerId, patch) {
      const sticker = await db.stickers.get(stickerId)

      if (!sticker) {
        throw new Error(`Cannot update sticker "${stickerId}": sticker not found`)
      }

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
