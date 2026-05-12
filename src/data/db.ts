import Dexie, { type Transaction, type Table } from 'dexie'
import type { CollectionEntry, Sticker, Team } from '../domain/types'

export type AppMeta = {
  key: string
  value: string
}

function normalizeEntriesV2(tx: Transaction) {
  return tx.table('entries').toCollection().modify((entry) => {
    if (typeof entry.duplicateCount !== 'number') {
      entry.duplicateCount = 0
    }

    if (typeof entry.needNote !== 'string') {
      entry.needNote = ''
    }
  })
}

export class StickerTrackerDb extends Dexie {
  teams!: Table<Team, string>
  stickers!: Table<Sticker, string>
  entries!: Table<CollectionEntry, string>
  meta!: Table<AppMeta, string>

  constructor() {
    super('sticker-tracker')

    this.version(1).stores({
      teams: 'id,order,group,name',
      stickers: 'id,teamId,number,category',
      entries: 'stickerId,status,updatedAt',
      meta: 'key',
    })

    this.version(2)
      .stores({
        teams: 'id,order,group,name',
        stickers: 'id,teamId,number,category',
        entries: 'stickerId,status,updatedAt,duplicateCount',
        meta: 'key',
      })
      .upgrade(normalizeEntriesV2)
  }
}
