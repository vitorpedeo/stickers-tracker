# Share Missing Stickers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a share button to the Dashboard that sends the user's missing stickers grouped by team via the Web Share API (clipboard fallback on desktop).

**Architecture:** A pure domain function `buildMissingByTeam` handles data transformation. A `useShareMissing` hook encapsulates fetching, formatting, and sharing — callable from any page. The Dashboard wires the hook to a button in a new sticky top bar.

**Tech Stack:** React, TypeScript, Vitest, Web Share API, Clipboard API

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/domain/share.ts` | Create | Pure function: filter + sort missing stickers by team |
| `src/domain/__tests__/share.test.ts` | Create | Unit tests for `buildMissingByTeam` |
| `src/features/stickers/useShareMissing.ts` | Create | Hook: fetch → transform → format → share |
| `src/pages/DashboardPage.tsx` | Modify | Add sticky top bar with SHARE MISSING button |

---

## Task 1: `buildMissingByTeam` pure function

**Files:**
- Create: `src/domain/share.ts`
- Create: `src/domain/__tests__/share.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/domain/__tests__/share.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/domain/__tests__/share.test.ts
```

Expected: FAIL with "Cannot find module '../share'"

- [ ] **Step 3: Implement `buildMissingByTeam`**

Create `src/domain/share.ts`:

```ts
import type { CollectionEntry, Sticker, Team } from './types'

export type MissingByTeam = {
  team: Team
  missingNumbers: string[]
}

export function buildMissingByTeam(
  teams: Team[],
  stickers: Sticker[],
  entries: CollectionEntry[],
  teamId?: string,
): MissingByTeam[] {
  const collectedIds = new Set(
    entries.filter((e) => e.status === 'collected').map((e) => e.stickerId),
  )

  const filteredTeams = teamId ? teams.filter((t) => t.id === teamId) : teams

  return filteredTeams
    .map((team) => {
      const missingNumbers = stickers
        .filter((s) => s.teamId === team.id && !collectedIds.has(s.id))
        .map((s) => s.number)
      return { team, missingNumbers }
    })
    .filter((item) => item.missingNumbers.length > 0)
    .sort((left, right) => {
      if (left.team.group !== right.team.group) {
        return left.team.group.localeCompare(right.team.group)
      }
      if (left.team.order !== right.team.order) {
        return left.team.order - right.team.order
      }
      return left.team.name.localeCompare(right.team.name)
    })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/domain/__tests__/share.test.ts
```

Expected: all 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/share.ts src/domain/__tests__/share.test.ts
git commit -m "feat: add buildMissingByTeam domain function"
```

---

## Task 2: `useShareMissing` hook

**Files:**
- Create: `src/features/stickers/useShareMissing.ts`

- [ ] **Step 1: Implement the hook**

Create `src/features/stickers/useShareMissing.ts`:

```ts
import { useState } from 'react'
import { repository } from '../../data/repositorySingleton'
import { buildMissingByTeam } from '../../domain/share'
import type { MissingByTeam } from '../../domain/share'

function formatMissingText(grouped: MissingByTeam[]): string {
  if (grouped.length === 0) {
    return 'All stickers collected! 🎉'
  }

  return grouped
    .map(({ team, missingNumbers }) => {
      const numbers = missingNumbers.map((n) => `#${n}`).join(', ')
      return `${team.name}: ${numbers}`
    })
    .join('\n')
}

export function useShareMissing(teamId?: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const share = async () => {
    setIsLoading(true)
    try {
      const [teams, stickers, entries] = await Promise.all([
        repository.listTeams(),
        repository.listStickers(),
        repository.listEntries(),
      ])

      const grouped = buildMissingByTeam(teams, stickers, entries, teamId)
      const text = formatMissingText(grouped)

      if (navigator.share) {
        await navigator.share({ text })
      } else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return { share, isLoading, copied }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/features/stickers/useShareMissing.ts
git commit -m "feat: add useShareMissing hook"
```

---

## Task 3: Dashboard share button

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

The Dashboard currently has no sticky top bar. Add one matching the pattern used in `TeamsPage` and `TradePage` (a `div` with `className="sticky-bar"`). Wire `useShareMissing` to the button.

- [ ] **Step 1: Add sticky bar with share button to DashboardPage**

In `src/pages/DashboardPage.tsx`, add the import and wire the hook. The full updated file:

```tsx
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { repository } from '../data/repositorySingleton'
import { buildTeamProgress, summarizeAlbum } from '../domain/progress'
import type { TeamGroup } from '../domain/types'
import { useInitializeSeed } from '../features/stickers/hooks'
import { useShareMissing } from '../features/stickers/useShareMissing'

const GROUPS: TeamGroup[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
const GROUP_COLORS = ['#FFD43A', '#8FE0B5', '#FFB7C7', '#4FB3FF']

function ProgressRing({
  pct,
  size = 84,
  stroke = 10,
}: {
  pct: number
  size?: number
  stroke?: number
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c - (pct / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="#fff" stroke="#0B0B0F" strokeWidth="3" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#E83838"
        strokeWidth={stroke}
        strokeLinecap="butt"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dy="2"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="Archivo Black"
        fontSize={size / 3.4}
        fill="#0B0B0F"
      >
        {pct}%
      </text>
    </svg>
  )
}

export function DashboardPage() {
  const seedInit = useInitializeSeed()
  const navigate = useNavigate()
  const { share, isLoading: shareLoading, copied } = useShareMissing()

  const { data } = useQuery({
    queryKey: ['dashboard-view'],
    enabled: seedInit.isSuccess,
    queryFn: async () => {
      const [teams, stickers, entries] = await Promise.all([
        repository.listTeams(),
        repository.listStickers(),
        repository.listEntries(),
      ])

      const teamProgress = buildTeamProgress(teams, stickers, entries)
      const album = summarizeAlbum(teams, stickers, entries)

      const groupProgress = GROUPS.map((group) => {
        const teamsInGroup = teamProgress.filter((item) => item.team.group === group)
        const collected = teamsInGroup.reduce((acc, item) => acc + item.collected, 0)
        const total = teamsInGroup.reduce((acc, item) => acc + item.total, 0)
        const progress = total === 0 ? 0 : Math.round((collected / total) * 100)
        return { group, collected, total, progress }
      })

      const closest = teamProgress
        .filter((x) => x.missing > 0 && x.missing <= 8)
        .sort((a, b) => a.missing - b.missing)
        .slice(0, 3)

      return { album, groupProgress, closest }
    },
  })

  const album = data?.album
  const pct = album?.completion ?? 0

  return (
    <>
      {/* Top bar */}
      <div className="sticky-bar">
        <h1 style={{ flex: 1 }}>ALBUM</h1>
        <button
          type="button"
          className="nb-chip"
          onClick={share}
          disabled={shareLoading}
        >
          {copied ? 'COPIED!' : shareLoading ? 'LOADING...' : 'SHARE MISSING'}
        </button>
      </div>

      {/* Progress hero card */}
      <div style={{ padding: '8px 18px' }}>
        <div className="nb-card nb-card--yellow" style={{ padding: 18 }}>
          <div className="row items-center between" style={{ marginBottom: 12, gap: 16 }}>
            <div>
              <div className="mono uc text-xs" style={{ opacity: 0.7 }}>Album completion</div>
              <div className="display" style={{ fontSize: 52, marginTop: 2 }}>{pct}%</div>
            </div>
            <ProgressRing pct={pct} />
          </div>
          <div className="nb-progress" style={{ marginBottom: 12 }}>
            <span
              className="nb-progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="row gap-2 wrap">
            <span className="nb-tag">{album?.collected ?? 0} got</span>
            <span className="nb-tag nb-tag--white">{album?.missing ?? 0} missing</span>
            <span className="nb-tag nb-tag--red">{album?.duplicateCopies ?? 0} dupes</span>
          </div>
        </div>
      </div>

      {/* Closest to done */}
      {(data?.closest?.length ?? 0) > 0 && (
        <>
          <div className="section-head">
            <h2 className="section-title">CLOSEST TO DONE</h2>
            <span className="mono text-xs text-mute">Top 3</span>
          </div>
          <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data!.closest.map(({ team, missing, collected, total }) => (
              <div
                key={team.id}
                className="nb-card nb-card--white"
                style={{ padding: '12px 14px', cursor: 'pointer' }}
                onClick={() => navigate(`/teams/${team.id}`)}
              >
                <div className="row items-center gap-3">
                  <div
                    className="flag-box"
                    style={{ width: 42, height: 42, borderRadius: 10 }}
                  >
                    <img src={team.flag} alt={team.name} />
                  </div>
                  <div className="flex-1">
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{team.name}</div>
                    <div className="mono text-xs text-mute">
                      {collected}/{total} · GROUP {team.group}
                    </div>
                  </div>
                  <span className="nb-tag nb-tag--red">{missing} LEFT</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Group grid */}
      <div className="section-head">
        <h2 className="section-title">GROUPS</h2>
      </div>
      <div style={{ padding: '0 18px' }}>
        <div className="group-grid">
          {(data?.groupProgress ?? []).map((item, i) => (
            <div
              key={item.group}
              className="group-cell"
              style={{ background: GROUP_COLORS[i % 4] }}
            >
              <div className="display" style={{ fontSize: 20 }}>{item.group}</div>
              <div className="mono" style={{ fontSize: 11, marginTop: 2 }}>{item.progress}%</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 20 }} />
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/DashboardPage.tsx
git commit -m "feat: add share missing button to dashboard"
```
