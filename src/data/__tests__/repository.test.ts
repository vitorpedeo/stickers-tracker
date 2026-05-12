import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { buildInitialCollection } from '../../domain/seed'
import { CURRENT_SEED_VERSION } from '../migrations'
import { StickerTrackerDb } from '../db'
import { createRepository } from '../repository'

describe('repository status rules', () => {
  beforeEach(async () => {
    const repository = createRepository()
    await repository.resetDatabase()
    await repository.seed(buildInitialCollection())
  })

  it('resets duplicates when sticker is set to missing', async () => {
    const repository = createRepository()

    await repository.updateSticker('canada-01', {
      status: 'collected',
      duplicateCount: 3,
    })

    await repository.updateSticker('canada-01', { status: 'missing' })

    const entry = await repository.getEntry('canada-01')
    expect(entry?.duplicateCount).toBe(0)
  })

  it('never stores negative duplicate counts', async () => {
    const repository = createRepository()

    await repository.updateSticker('canada-01', {
      status: 'collected',
      duplicateCount: -4,
    })

    const entry = await repository.getEntry('canada-01')
    expect(entry?.duplicateCount).toBe(0)
  })

  it('throws when updating a sticker that does not exist', async () => {
    const repository = createRepository()

    await expect(
      repository.updateSticker('missing-sticker-01', { status: 'collected' }),
    ).rejects.toThrow('sticker not found')
  })
})

describe('repository seed lifecycle', () => {
  beforeEach(async () => {
    const repository = createRepository()
    await repository.resetDatabase()
  })

  it('reseeds when stickers are empty', async () => {
    const repository = createRepository()

    const reseeded = await repository.initializeSeed(buildInitialCollection())
    const stickers = await repository.listStickers()
    const seedVersion = await repository.getSeedVersion()

    expect(reseeded).toBe(true)
    expect(stickers.length).toBeGreaterThan(0)
    expect(seedVersion).toBe(CURRENT_SEED_VERSION)
  })

  it('reseeds when stored seed version mismatches current version', async () => {
    const repository = createRepository()
    await repository.seed(buildInitialCollection())
    await repository.updateSticker('canada-01', {
      status: 'collected',
      duplicateCount: 2,
    })

    const db = new StickerTrackerDb()
    await db.meta.put({ key: 'seedVersion', value: '2025.9' })
    await db.close()

    const reseeded = await repository.initializeSeed(buildInitialCollection())
    const seedVersion = await repository.getSeedVersion()
    const entry = await repository.getEntry('canada-01')

    expect(reseeded).toBe(true)
    expect(seedVersion).toBe(CURRENT_SEED_VERSION)
    expect(entry).toBeUndefined()
  })

  it('does not reseed when stickers exist and seed version matches', async () => {
    const repository = createRepository()
    await repository.seed(buildInitialCollection())
    await repository.updateSticker('canada-01', {
      status: 'collected',
      duplicateCount: 2,
    })

    const reseeded = await repository.initializeSeed(buildInitialCollection())
    const entry = await repository.getEntry('canada-01')

    expect(reseeded).toBe(false)
    expect(entry?.status).toBe('collected')
    expect(entry?.duplicateCount).toBe(2)
  })
})
