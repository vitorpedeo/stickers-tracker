import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { buildInitialCollection } from '../../domain/seed'
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
})
