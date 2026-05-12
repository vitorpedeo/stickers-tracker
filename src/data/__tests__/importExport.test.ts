import { describe, expect, it } from 'vitest'
import { validateImportPayload } from '../importExport'

describe('import validation', () => {
  it('rejects malformed payload', () => {
    const result = validateImportPayload({ foo: 'bar' })
    expect(result.ok).toBe(false)
  })

  it('accepts payload with entries array and seedVersion string', () => {
    const result = validateImportPayload({
      entries: [],
      seedVersion: '2026.1',
    })

    expect(result.ok).toBe(true)
  })
})
