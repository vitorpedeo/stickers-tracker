import { describe, expect, it } from 'vitest'
import { buildMissingByTeam } from '../share'
import type { CollectionEntry, Sticker, Team } from '../types'

const makeTeam = (id: string, group: string, order: number): Team => ({
  id,
  name: `Team ${id}`,
  flag: `/flags/${id}.png`,
  group: group as Team['group'],
  order,
})

const makeSticker = (id: string, teamId: string, number: string): Sticker => ({
  id,
  teamId,
  number,
  name: `Sticker ${number}`,
  category: 'team',
})

const makeEntry = (stickerId: string, status: 'collected' | 'missing'): CollectionEntry => ({
  stickerId,
  status,
  duplicateCount: 0,
  needNote: '',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

describe('buildMissingByTeam', () => {
  it('returns teams sorted by group then order then name', () => {
    const teams = [
      makeTeam('b', 'B', 1),
      makeTeam('a2', 'A', 2),
      makeTeam('a1', 'A', 1),
    ]
    const stickers = [
      makeSticker('s1', 'b', '1'),
      makeSticker('s2', 'a2', '1'),
      makeSticker('s3', 'a1', '1'),
    ]
    const entries: CollectionEntry[] = []

    const result = buildMissingByTeam(teams, stickers, entries)

    expect(result.map((r) => r.team.id)).toEqual(['a1', 'a2', 'b'])
  })

  it('excludes teams with no missing stickers', () => {
    const teams = [makeTeam('x', 'A', 1), makeTeam('y', 'A', 2)]
    const stickers = [
      makeSticker('s1', 'x', '1'),
      makeSticker('s2', 'y', '1'),
    ]
    const entries = [makeEntry('s1', 'collected'), makeEntry('s2', 'collected')]

    const result = buildMissingByTeam(teams, stickers, entries)

    expect(result).toHaveLength(0)
  })

  it('only includes missing sticker numbers, not collected', () => {
    const teams = [makeTeam('x', 'A', 1)]
    const stickers = [
      makeSticker('s1', 'x', '3'),
      makeSticker('s2', 'x', '7'),
      makeSticker('s3', 'x', '12'),
    ]
    const entries = [makeEntry('s2', 'collected')]

    const result = buildMissingByTeam(teams, stickers, entries)

    expect(result).toHaveLength(1)
    expect(result[0].missingNumbers).toEqual(['3', '12'])
  })

  it('filters to a single team when teamId is provided', () => {
    const teams = [makeTeam('x', 'A', 1), makeTeam('y', 'A', 2)]
    const stickers = [
      makeSticker('s1', 'x', '1'),
      makeSticker('s2', 'y', '1'),
    ]
    const entries: CollectionEntry[] = []

    const result = buildMissingByTeam(teams, stickers, entries, 'x')

    expect(result).toHaveLength(1)
    expect(result[0].team.id).toBe('x')
  })

  it('treats stickers with no entry as missing', () => {
    const teams = [makeTeam('x', 'A', 1)]
    const stickers = [makeSticker('s1', 'x', '5')]
    const entries: CollectionEntry[] = []

    const result = buildMissingByTeam(teams, stickers, entries)

    expect(result[0].missingNumbers).toEqual(['5'])
  })

  it('treats stickers with status missing as missing', () => {
    const teams = [makeTeam('x', 'A', 1)]
    const stickers = [makeSticker('s1', 'x', '5')]
    const entries = [makeEntry('s1', 'missing')]

    const result = buildMissingByTeam(teams, stickers, entries)

    expect(result[0].missingNumbers).toEqual(['5'])
  })
})
