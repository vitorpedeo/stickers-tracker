import type { CollectionEntry } from '../domain/types'

export type ImportPayload = {
  entries: CollectionEntry[]
  seedVersion: string
}

type ImportValidationResult =
  | { ok: true; value: ImportPayload }
  | { ok: false; error: string }

export function validateImportPayload(payload: unknown): ImportValidationResult {
  if (typeof payload !== 'object' || payload === null) {
    return { ok: false, error: 'Invalid import payload: expected object.' }
  }

  const record = payload as Record<string, unknown>

  if (!Array.isArray(record.entries)) {
    return { ok: false, error: 'Invalid import payload: missing entries array.' }
  }

  if (typeof record.seedVersion !== 'string') {
    return { ok: false, error: 'Invalid import payload: missing seedVersion string.' }
  }

  return {
    ok: true,
    value: {
      entries: record.entries as CollectionEntry[],
      seedVersion: record.seedVersion,
    },
  }
}
