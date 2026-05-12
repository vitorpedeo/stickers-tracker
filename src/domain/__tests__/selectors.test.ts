import { describe, expect, it } from 'vitest'
import { summarizeCollection } from '../selectors'
import type { CollectionEntry, Sticker } from '../types'

describe('summarizeCollection', () => {
  it('computes totals and completion', () => {
    const stickers: Sticker[] = [
      { id: 'a', teamId: 'x', number: '1', name: 'A', category: 'team' },
      { id: 'b', teamId: 'x', number: '2', name: 'B', category: 'team' },
    ]
    const entries: CollectionEntry[] = [
      {
        stickerId: 'a',
        status: 'collected',
        duplicateCount: 2,
        needNote: '',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        stickerId: 'b',
        status: 'missing',
        duplicateCount: 0,
        needNote: '',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    const summary = summarizeCollection(stickers, entries)
    expect(summary.collected).toBe(1)
    expect(summary.missing).toBe(1)
    expect(summary.duplicates).toBe(2)
    expect(summary.completion).toBe('50%')
  })
})
