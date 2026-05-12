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

  it('contains 960 team stickers and 20 special stickers', () => {
    const seeded = buildInitialCollection()
    const teamStickers = seeded.stickers.filter((sticker) => sticker.category === 'team')
    const specialStickers = seeded.stickers.filter((sticker) => sticker.category === 'special')

    expect(teamStickers).toHaveLength(960)
    expect(specialStickers).toHaveLength(20)
  })

  it('uses valid team ids for every team sticker', () => {
    const seeded = buildInitialCollection()
    const validTeamIds = new Set(seeded.teams.map((team) => team.id))
    const teamStickers = seeded.stickers.filter((sticker) => sticker.category === 'team')

    expect(teamStickers.every((sticker) => sticker.teamId !== null && validTeamIds.has(sticker.teamId))).toBe(true)
  })

  it('returns isolated team objects between calls', () => {
    const firstSeed = buildInitialCollection()
    firstSeed.teams[0].name = 'Mutated Team Name'
    const secondSeed = buildInitialCollection()

    expect(secondSeed.teams[0].name).not.toBe('Mutated Team Name')
  })

  it('contains unique sticker ids', () => {
    const seeded = buildInitialCollection()
    const ids = seeded.stickers.map((sticker) => sticker.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
