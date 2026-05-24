import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGeneratePdf } from '../useGeneratePdf'

// Mock WantlistPdf module to avoid pulling in @react-pdf/renderer internals
vi.mock('../WantlistPdf', () => ({
  WantlistDocument: () => null,
}))

// Mock pdf() from @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  pdf: vi.fn(() => ({
    toBlob: vi.fn().mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' })),
  })),
}))

// Mock repository singleton
vi.mock('../../../data/repositorySingleton', () => ({
  repository: {
    listTeams: vi.fn(),
    listStickers: vi.fn(),
    listEntries: vi.fn(),
  },
}))

// Mock URL download APIs
const mockCreateObjectURL = vi.fn(() => 'blob:test-url')
const mockRevokeObjectURL = vi.fn()
Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL, writable: true })
Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL, writable: true })

const makeTeam = (id: string, group = 'A', order = 1) => ({
  id,
  name: `Team ${id}`,
  flag: `https://flagcdn.com/${id.toLowerCase()}.svg`,
  group: group as 'A',
  order,
})

const makeSticker = (id: string, teamId: string, number: string) => ({
  id,
  teamId,
  number,
  name: `Sticker ${number}`,
  category: 'team' as const,
})

const makeEntry = (stickerId: string, status: 'collected' | 'missing') => ({
  stickerId,
  status,
  duplicateCount: 0,
  needNote: '',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

describe('useGeneratePdf', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockCreateObjectURL.mockReturnValue('blob:test-url')

    // Re-apply pdf mock after clearAllMocks resets the implementation
    const { pdf } = await import('@react-pdf/renderer')
    ;(pdf as ReturnType<typeof vi.fn>).mockReturnValue({
      toBlob: vi.fn().mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' })),
    })

    const { repository } = await import('../../../data/repositorySingleton')
    ;(repository.listTeams as ReturnType<typeof vi.fn>).mockResolvedValue([])
    ;(repository.listStickers as ReturnType<typeof vi.fn>).mockResolvedValue([])
    ;(repository.listEntries as ReturnType<typeof vi.fn>).mockResolvedValue([])
  })

  it('starts with isLoading false and error null', () => {
    const { result } = renderHook(() => useGeneratePdf())
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('does not call pdf() when no stickers are missing', async () => {
    const { repository } = await import('../../../data/repositorySingleton')
    ;(repository.listTeams as ReturnType<typeof vi.fn>).mockResolvedValue([makeTeam('MEX')])
    ;(repository.listStickers as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeSticker('s1', 'MEX', '01'),
    ])
    ;(repository.listEntries as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeEntry('s1', 'collected'),
    ])

    const { pdf } = await import('@react-pdf/renderer')
    const { result } = renderHook(() => useGeneratePdf())

    await act(async () => {
      await result.current.generate()
    })

    expect(pdf).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })

  it('calls pdf() and triggers download when stickers are missing', async () => {
    const { repository } = await import('../../../data/repositorySingleton')
    ;(repository.listTeams as ReturnType<typeof vi.fn>).mockResolvedValue([makeTeam('MEX')])
    ;(repository.listStickers as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeSticker('s1', 'MEX', '01'),
      makeSticker('s2', 'MEX', '02'),
    ])
    ;(repository.listEntries as ReturnType<typeof vi.fn>).mockResolvedValue([])

    const { pdf } = await import('@react-pdf/renderer')
    const { result } = renderHook(() => useGeneratePdf())

    await act(async () => {
      await result.current.generate()
    })

    expect(pdf).toHaveBeenCalledOnce()
    expect(mockCreateObjectURL).toHaveBeenCalledOnce()
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url')
    expect(result.current.isLoading).toBe(false)
  })

  it('sets error when repository rejects', async () => {
    const { repository } = await import('../../../data/repositorySingleton')
    ;(repository.listTeams as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'))

    const { result } = renderHook(() => useGeneratePdf())

    await act(async () => {
      await result.current.generate()
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('DB error')
    expect(result.current.isLoading).toBe(false)
  })

  it('ignores concurrent generate() calls', async () => {
    const { repository } = await import('../../../data/repositorySingleton')
    ;(repository.listTeams as ReturnType<typeof vi.fn>).mockResolvedValue([makeTeam('MEX')])
    ;(repository.listStickers as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeSticker('s1', 'MEX', '01'),
    ])
    ;(repository.listEntries as ReturnType<typeof vi.fn>).mockResolvedValue([])

    const { pdf } = await import('@react-pdf/renderer')
    const { result } = renderHook(() => useGeneratePdf())

    await act(async () => {
      const first = result.current.generate()
      const second = result.current.generate() // concurrent — should be a no-op
      await Promise.all([first, second])
    })

    expect(pdf).toHaveBeenCalledOnce()
  })

  it('sets error when pdf().toBlob() rejects', async () => {
    const { repository } = await import('../../../data/repositorySingleton')
    ;(repository.listTeams as ReturnType<typeof vi.fn>).mockResolvedValue([makeTeam('MEX')])
    ;(repository.listStickers as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeSticker('s1', 'MEX', '01'),
    ])
    ;(repository.listEntries as ReturnType<typeof vi.fn>).mockResolvedValue([])

    const { pdf } = await import('@react-pdf/renderer')
    ;(pdf as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      toBlob: vi.fn().mockRejectedValue(new Error('render failed')),
    })

    const { result } = renderHook(() => useGeneratePdf())

    await act(async () => {
      await result.current.generate()
    })

    expect(result.current.error?.message).toBe('render failed')
    expect(result.current.isLoading).toBe(false)
  })
})
