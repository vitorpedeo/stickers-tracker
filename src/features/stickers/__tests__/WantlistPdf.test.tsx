import { createElement } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Font, pdf } from '@react-pdf/renderer'
import { WantlistDocument } from '../WantlistPdf'
import type { WantlistTeamData } from '../WantlistPdf'

const rendererMocks = vi.hoisted(() => ({
  Image: vi.fn(() => null),
}))

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children: React.ReactNode }) => children,
  Page: ({ children }: { children: React.ReactNode }) => children,
  View: ({ children }: { children?: React.ReactNode }) => children ?? null,
  Text: ({ children }: { children?: React.ReactNode }) => children ?? null,
  Image: rendererMocks.Image,
  Svg: ({ children }: { children?: React.ReactNode }) => children ?? null,
  StyleSheet: { create: <T,>(s: T): T => s },
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
    const [fontConfig] = (Font.register as ReturnType<typeof vi.fn>).mock.calls[0]

    expect(fontConfig).toEqual(expect.objectContaining({ family: 'ArchivoBlack' }))
    expect(fontConfig.src).toContain('ArchivoBlack-Regular.ttf')
    expect(fontConfig.src).not.toMatch(/^https?:\/\//)
  })

  it('can be passed to pdf() which resolves to a Blob (via mock)', async () => {
    const blob = await (pdf as unknown as (el: unknown) => { toBlob: () => Promise<Blob> })(
      createElement(WantlistDocument, { teams: sample, generatedDate: 'MAY 24, 2026' }),
    ).toBlob()
    expect(blob).toBeInstanceOf(Blob)
  })

  it('renders missing sticker chips without a leading hash', () => {
    const { container } = render(createElement(WantlistDocument, {
      teams: [
        {
          team: { id: 'MEX', name: 'Mexico', flag: 'https://flagcdn.com/mx.svg', group: 'A', order: 1 },
          total: 20,
          missingNumbers: ['5'],
        },
      ],
      generatedDate: 'MAY 24, 2026',
    }))

    expect(container.textContent).toContain('5')
    expect(container.textContent).not.toContain('#5')
  })

  it('uses high-resolution Flagcdn PNGs for regular country SVG flags', () => {
    rendererMocks.Image.mockClear()

    render(createElement(WantlistDocument, { teams: sample, generatedDate: 'MAY 24, 2026' }))

    expect(rendererMocks.Image).toHaveBeenCalledWith(
      expect.objectContaining({
        src: 'https://flagcdn.com/w320/mx.png',
        style: expect.objectContaining({ objectFit: 'cover' }),
      }),
      undefined,
    )
  })

  it('uses a bundled PNG for the special UN flag', () => {
    rendererMocks.Image.mockClear()

    render(createElement(WantlistDocument, {
      teams: [
        {
          team: { id: 'FWC', name: 'FWC', flag: 'https://flagcdn.com/un.svg', group: 'SPECIAL', order: 1 },
          total: 1,
          missingNumbers: ['01'],
        },
      ],
      generatedDate: 'MAY 24, 2026',
    }))

    expect(rendererMocks.Image).toHaveBeenCalledWith(
      expect.objectContaining({ src: expect.stringContaining('un.png') }),
      undefined,
    )
    expect(rendererMocks.Image).not.toHaveBeenCalledWith(
      expect.objectContaining({ src: 'https://flagcdn.com/w40/un.png' }),
      undefined,
    )
  })
})
