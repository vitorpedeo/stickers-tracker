import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Font, pdf } from '@react-pdf/renderer'
import { WantlistDocument } from '../WantlistPdf'
import type { WantlistTeamData } from '../WantlistPdf'

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children: React.ReactNode }) => children,
  Page: ({ children }: { children: React.ReactNode }) => children,
  View: ({ children }: { children?: React.ReactNode }) => children ?? null,
  Text: ({ children }: { children?: React.ReactNode }) => children ?? null,
  Image: () => null,
  Svg: ({ children }: { children?: React.ReactNode }) => children ?? null,
  StyleSheet: { create: (s: unknown) => s },
  Font: { register: vi.fn() },
  pdf: vi.fn(() => ({
    toBlob: vi.fn().mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' })),
  })),
}))

const sample: WantlistTeamData[] = [
  {
    team: { id: 'MEX', name: 'Mexico', flag: 'https://flagcdn.com/mx.svg', group: 'A', order: 1 },
    total: 18,
    missingNumbers: ['01', '05', '09'],
  },
]

describe('WantlistDocument', () => {
  it('is exported as a function', () => {
    expect(typeof WantlistDocument).toBe('function')
  })

  it('registers ArchivoBlack font at module load', () => {
    expect(Font.register).toHaveBeenCalledWith(
      expect.objectContaining({ family: 'ArchivoBlack' }),
    )
  })

  it('renders to a PDF blob without throwing', async () => {
    const blob = await (pdf as ReturnType<typeof vi.fn>)(
      createElement(WantlistDocument, { teams: sample, generatedDate: 'MAY 24, 2026' }),
    ).toBlob()
    expect(blob).toBeInstanceOf(Blob)
  })
})
