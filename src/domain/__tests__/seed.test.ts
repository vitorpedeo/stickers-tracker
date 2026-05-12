import { describe, expect, it } from 'vitest'
import { buildInitialCollection } from '../seed'

describe('seed data', () => {
  it('contains 48 teams', () => {
    const seeded = buildInitialCollection()
    expect(seeded.teams).toHaveLength(48)
  })

  it('contains 980 stickers total', () => {
    const seeded = buildInitialCollection()
    expect(seeded.stickers).toHaveLength(980)
  })

  it('contains unique sticker ids', () => {
    const seeded = buildInitialCollection()
    const ids = seeded.stickers.map((sticker) => sticker.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
