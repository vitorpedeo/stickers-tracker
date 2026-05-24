# PDF Wantlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the text-copy "SHARE MISSING" button with a PDF download that generates a styled A4 wantlist of all missing stickers, grouped by team.

**Architecture:** `WantlistPdf.tsx` is a pure `@react-pdf/renderer` Document component (no I/O). `useGeneratePdf.ts` fetches data, builds the PDF blob, and triggers a browser download. `DashboardPage.tsx` swaps its button to call `useGeneratePdf`. `useShareMissing` is untouched.

**Tech Stack:** `@react-pdf/renderer` (latest), React 19, TypeScript, Vitest + @testing-library/react

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/features/stickers/WantlistPdf.tsx` | react-pdf Document — layout, styles, font registration |
| Create | `src/features/stickers/__tests__/WantlistPdf.test.tsx` | Module smoke tests |
| Create | `src/features/stickers/useGeneratePdf.ts` | Hook: fetch → build PDF blob → download |
| Create | `src/features/stickers/__tests__/useGeneratePdf.test.ts` | Hook behavior tests |
| Modify | `src/pages/DashboardPage.tsx` | Swap share button for PDF download button |
| Modify | `src/pages/__tests__/dashboard-layout.test.tsx` | Assert "DOWNLOAD PDF" button present |

---

## Task 1: Install @react-pdf/renderer

**Files:** `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install**

```bash
pnpm add @react-pdf/renderer
```

- [ ] **Step 2: Verify entry in package.json**

```bash
grep '@react-pdf/renderer' package.json
```

Expected output (version may differ):
```
"@react-pdf/renderer": "^4.x.x",
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @react-pdf/renderer"
```

---

## Task 2: Create WantlistPdf.tsx (test-first)

**Files:**
- Create: `src/features/stickers/__tests__/WantlistPdf.test.tsx`
- Create: `src/features/stickers/WantlistPdf.tsx`

- [ ] **Step 1: Write failing test**

Create `src/features/stickers/__tests__/WantlistPdf.test.tsx`:

```tsx
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
  StyleSheet: { create: <T>(s: T): T => s },
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
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm vitest run src/features/stickers/__tests__/WantlistPdf.test.tsx
```

Expected: `Cannot find module '../WantlistPdf'`

- [ ] **Step 3: Create WantlistPdf.tsx**

Create `src/features/stickers/WantlistPdf.tsx`:

```tsx
import { Document, Font, Image, Page, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import type { Team } from '../../domain/types'

Font.register({
  family: 'ArchivoBlack',
  src: 'https://fonts.gstatic.com/s/archivoblack/v21/HTxqL289NzCGg4MzN6KJ7eW6OYuP.ttf',
})

export type WantlistTeamData = {
  team: Team
  total: number
  missingNumbers: string[]
}

type Props = {
  teams: WantlistTeamData[]
  generatedDate: string
}

const INK = '#0B0B0F'
const CREAM = '#F8F1DE'
const MUTE = '#6B6B72'
const RED = '#E83838'

// Text cast for SVG context — react-pdf uses the same Text primitive inside Svg
// but SVG attributes (x, y, fill, stroke) aren't in the DOM Text prop types.
const SvgText = Text as React.ComponentType<React.ComponentProps<typeof Text> & {
  x?: number
  y?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  fontSize?: number
  fontFamily?: string
}>

const s = StyleSheet.create({
  page: {
    backgroundColor: CREAM,
    paddingHorizontal: 32,
    paddingTop: 30,
    paddingBottom: 50,
  },
  headerLabel: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: MUTE,
    letterSpacing: 1,
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  titleBlock: {
    flex: 1,
  },
  titleStickers: {
    fontFamily: 'ArchivoBlack',
    fontSize: 56,
    color: INK,
    lineHeight: 1,
  },
  dateText: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: MUTE,
    letterSpacing: 1,
    paddingBottom: 6,
  },
  divider: {
    borderBottomWidth: 3,
    borderBottomColor: INK,
    marginTop: 8,
    marginBottom: 4,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  flagBox: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: INK,
    overflow: 'hidden',
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  flagImg: {
    width: 52,
    height: 52,
  },
  teamInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 2,
  },
  teamName: {
    fontFamily: 'ArchivoBlack',
    fontSize: 14,
    color: INK,
  },
  teamMeta: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: MUTE,
    letterSpacing: 0.5,
  },
  teamSubtitle: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: MUTE,
    marginBottom: 6,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: INK,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: INK,
  },
  badge: {
    width: 52,
    height: 52,
    backgroundColor: RED,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeNum: {
    fontFamily: 'ArchivoBlack',
    fontSize: 20,
    color: '#fff',
    lineHeight: 1,
  },
  badgeLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 6,
    color: '#fff',
    letterSpacing: 0.5,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: MUTE,
    borderBottomStyle: 'dashed',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: INK,
    paddingTop: 6,
  },
  footerText: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: MUTE,
    letterSpacing: 0.5,
  },
})

function flagPngUrl(svgUrl: string): string {
  const match = svgUrl.match(/flagcdn\.com\/(.+?)\.svg$/)
  return match ? `https://flagcdn.com/w40/${match[1]}.png` : svgUrl
}

function TeamRow({ item }: { item: WantlistTeamData }) {
  const { team, total, missingNumbers } = item
  return (
    <View>
      <View style={s.teamRow}>
        <View style={s.flagBox}>
          <Image src={flagPngUrl(team.flag)} style={s.flagImg} />
        </View>

        <View style={s.teamInfo}>
          <View style={s.nameRow}>
            <Text style={s.teamName}>{team.name.toUpperCase()}</Text>
            <Text style={s.teamMeta}>{team.id} · GRP {team.group}</Text>
          </View>
          <Text style={s.teamSubtitle}>{missingNumbers.length} OF {total} MISSING</Text>
          <View style={s.chipsWrap}>
            {missingNumbers.map((num) => (
              <View key={num} style={s.chip}>
                <Text style={s.chipText}>#{num}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.badge}>
          <Text style={s.badgeNum}>{missingNumbers.length}</Text>
          <Text style={s.badgeLabel}>LEFT</Text>
        </View>
      </View>
    </View>
  )
}

export function WantlistDocument({ teams, generatedDate }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.headerLabel}>WORLD CUP 2026 · STICKER WANTLIST</Text>

        <View style={s.titleRow}>
          <View style={s.titleBlock}>
            <Text style={s.titleStickers}>STICKERS</Text>
            {/* Outlined text via SVG stroke/fill — matches the hollow display style in the design */}
            <Svg height={70} width={531}>
              <SvgText x={0} y={60} fontFamily="ArchivoBlack" fontSize={56} fill="none" stroke={INK} strokeWidth={1.5}>
                WANTED.
              </SvgText>
            </Svg>
          </View>
          <Text style={s.dateText}>{generatedDate}</Text>
        </View>

        <View style={s.divider} />

        {teams.map((item, i) => (
          <View key={item.team.id} wrap={false}>
            <TeamRow item={item} />
            {i < teams.length - 1 && <View style={s.rowDivider} />}
          </View>
        ))}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>PRINTED FROM STICKERS TRACKER</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
pnpm vitest run src/features/stickers/__tests__/WantlistPdf.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/stickers/WantlistPdf.tsx src/features/stickers/__tests__/WantlistPdf.test.tsx
git commit -m "feat: add WantlistPdf react-pdf document component"
```

---

## Task 3: Create useGeneratePdf.ts (test-first)

**Files:**
- Create: `src/features/stickers/__tests__/useGeneratePdf.test.ts`
- Create: `src/features/stickers/useGeneratePdf.ts`

- [ ] **Step 1: Write failing tests**

Create `src/features/stickers/__tests__/useGeneratePdf.test.ts`:

```ts
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
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pnpm vitest run src/features/stickers/__tests__/useGeneratePdf.test.ts
```

Expected: `Cannot find module '../useGeneratePdf'`

- [ ] **Step 3: Create useGeneratePdf.ts**

Create `src/features/stickers/useGeneratePdf.ts`:

```ts
import { createElement, useRef, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { repository } from '../../data/repositorySingleton'
import { buildMissingByTeam } from '../../domain/share'
import { WantlistDocument } from './WantlistPdf'
import type { WantlistTeamData } from './WantlistPdf'

function formatDate(date: Date): string {
  return date
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase()
}

export function useGeneratePdf() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const inFlightRef = useRef(false)

  const generate = async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      const [teams, stickers, entries] = await Promise.all([
        repository.listTeams(),
        repository.listStickers(),
        repository.listEntries(),
      ])

      const missing = buildMissingByTeam(teams, stickers, entries)
      if (missing.length === 0) return

      const stickersByTeam = new Map<string, number>()
      for (const sticker of stickers) {
        if (sticker.teamId) {
          stickersByTeam.set(sticker.teamId, (stickersByTeam.get(sticker.teamId) ?? 0) + 1)
        }
      }

      const pdfTeams: WantlistTeamData[] = missing.map(({ team, missingNumbers }) => ({
        team,
        total: stickersByTeam.get(team.id) ?? 0,
        missingNumbers,
      }))

      const blob = await pdf(
        createElement(WantlistDocument, { teams: pdfTeams, generatedDate: formatDate(new Date()) }),
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'stickers-wantlist.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      inFlightRef.current = false
      setIsLoading(false)
    }
  }

  return { generate, isLoading, error }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pnpm vitest run src/features/stickers/__tests__/useGeneratePdf.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/stickers/useGeneratePdf.ts src/features/stickers/__tests__/useGeneratePdf.test.ts
git commit -m "feat: add useGeneratePdf hook"
```

---

## Task 4: Update DashboardPage

**Files:**
- Modify: `src/pages/DashboardPage.tsx`
- Modify: `src/pages/__tests__/dashboard-layout.test.tsx`

- [ ] **Step 1: Write failing test**

Open `src/pages/__tests__/dashboard-layout.test.tsx` and add a new `it` block inside the existing `describe('Dashboard layout', ...)`:

```tsx
it('renders a download pdf button', async () => {
  render(
    <AppProviders>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </AppProviders>,
  )

  expect(await screen.findByRole('button', { name: /download pdf/i })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm vitest run src/pages/__tests__/dashboard-layout.test.tsx
```

Expected: the new test fails with "Unable to find role=button with name /download pdf/i"

- [ ] **Step 3: Update DashboardPage.tsx**

In `src/pages/DashboardPage.tsx`:

Replace the import line:
```tsx
import { useShareMissing } from '../features/stickers/useShareMissing'
```
With:
```tsx
import { useGeneratePdf } from '../features/stickers/useGeneratePdf'
```

Replace in the component body:
```tsx
const { share, isLoading: shareLoading, copied } = useShareMissing()
```
With:
```tsx
const { generate, isLoading } = useGeneratePdf()
```

Replace the button:
```tsx
<button
  type="button"
  className="nb-chip"
  onClick={share}
  disabled={shareLoading}
>
  {copied ? 'COPIED!' : shareLoading ? 'LOADING...' : 'SHARE MISSING'}
</button>
```
With:
```tsx
<button
  type="button"
  className="nb-chip"
  onClick={generate}
  disabled={isLoading}
>
  {isLoading ? 'BUILDING PDF...' : 'DOWNLOAD PDF'}
</button>
```

- [ ] **Step 4: Run all tests**

```bash
pnpm test
```

Expected: all tests pass (or only pre-existing failures unrelated to this feature).

- [ ] **Step 5: Type-check**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/DashboardPage.tsx src/pages/__tests__/dashboard-layout.test.tsx
git commit -m "feat: replace share-text button with PDF download on dashboard"
```
