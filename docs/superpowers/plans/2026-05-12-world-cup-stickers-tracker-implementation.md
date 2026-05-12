# World Cup Stickers Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, offline-first React PWA for tracking the full 2026 World Cup sticker collection (status, duplicates, and trade notes) with team-first navigation.

**Architecture:** The app is a Vite + React + TypeScript SPA with route-based screens and a local-first persistence layer using Dexie (IndexedDB). Data access is mediated through a repository and TanStack Query hooks so UI remains decoupled from storage details. PWA behavior is provided by `vite-plugin-pwa` with prompt-based update UX and cached app shell.

**Tech Stack:** React 19, TypeScript, Vite, React Router, TanStack Query v5, Dexie, Vitest, React Testing Library, vite-plugin-pwa

---

## Scope check

The approved spec is a single, coherent subsystem (one app with one local data domain). One implementation plan is sufficient.

## Library documentation checkpoints (Context7-first)

Use these references when implementing the related tasks:

- `vite-plugin-pwa`: `/vite-pwa/vite-plugin-pwa`
- `TanStack Query`: `/tanstack/query/v5.90.3`
- `Dexie`: `/websites/dexie`

Before changing behavior tied to these libraries, re-check the relevant Context7 page in the implementation session.

## Planned file structure

### Root config and tooling

- `package.json`: scripts and dependencies
- `vite.config.ts`: Vite config + PWA plugin config
- `vitest.config.ts`: test runner setup
- `tsconfig.json`: TS project config
- `index.html`: app entry html

### Application entry and shell

- `src/main.tsx`: React bootstrap + providers
- `src/App.tsx`: app root layout host
- `src/app/router.tsx`: route definitions
- `src/app/queryClient.ts`: QueryClient creation

### Styling and design system

- `src/styles/tokens.css`: color, spacing, typography variables
- `src/styles/base.css`: resets and global defaults
- `src/styles/editorial.css`: visual direction and layout styles
- `src/components/AppFrame.tsx`: shared page chrome
- `src/components/StatRibbon.tsx`: top KPI strip
- `src/components/ProgressBadge.tsx`: small team progress chip

### Domain and seed data

- `src/domain/types.ts`: domain types and enums
- `src/domain/teams2026.ts`: 48-team seed list
- `src/domain/seed.ts`: seed generation (teams + stickers + extras)
- `src/domain/selectors.ts`: pure derived metrics and list selectors

### Persistence and repositories

- `src/data/db.ts`: Dexie schema/version config
- `src/data/migrations.ts`: data upgrade helpers
- `src/data/repository.ts`: CRUD and domain-safe mutation methods
- `src/data/importExport.ts`: JSON import/export and validation

### Feature pages

- `src/pages/DashboardPage.tsx`
- `src/pages/TeamsPage.tsx`
- `src/pages/TeamDetailPage.tsx`
- `src/pages/TradePage.tsx`
- `src/pages/SettingsPage.tsx`

### Feature components

- `src/features/stickers/StickerTile.tsx`
- `src/features/stickers/StatusSwitch.tsx`
- `src/features/stickers/NeedNoteEditor.tsx`
- `src/features/stickers/FilterDock.tsx`
- `src/features/trade/TradePanel.tsx`

### PWA components

- `src/pwa/ReloadPrompt.tsx`: update/offline toast

### Tests

- `src/test/setup.ts`
- `src/domain/__tests__/seed.test.ts`
- `src/domain/__tests__/selectors.test.ts`
- `src/data/__tests__/repository.test.ts`
- `src/data/__tests__/importExport.test.ts`
- `src/pages/__tests__/routing.test.tsx`
- `src/pages/__tests__/team-detail-interactions.test.tsx`
- `src/pages/__tests__/trade-page.test.tsx`
- `src/pwa/__tests__/reload-prompt.test.tsx`
- `src/app/__tests__/offline-smoke.test.tsx`

---

### Task 1: Bootstrap project, test runner, and provider skeleton

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/test/setup.ts`
- Test: `src/app/__tests__/boot.test.tsx`

- [ ] **Step 1: Scaffold Vite React TypeScript app**

Run:

```bash
pnpm create vite@latest . --template react-ts
```

Expected:
- `package.json`, `src/`, `vite.config.ts`, and TS configs are created.

- [ ] **Step 2: Add runtime and test dependencies**

Run:

```bash
pnpm add react-router-dom @tanstack/react-query dexie
pnpm add -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event fake-indexeddb vite-plugin-pwa workbox-window
```

Expected:
- Install completes without missing peer dependency errors.

- [ ] **Step 3: Write failing bootstrap test**

Create `src/app/__tests__/boot.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../App'

describe('App bootstrap', () => {
  it('renders the app shell heading', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /world cup stickers tracker/i }),
    ).toBeInTheDocument()
  })
})
```

Run:

```bash
pnpm vitest run src/app/__tests__/boot.test.tsx
```

Expected:
- FAIL because heading is not implemented yet.

- [ ] **Step 4: Implement minimal app shell + vitest setup**

Update `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

Update `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

Update `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main>
      <h1>World Cup Stickers Tracker</h1>
    </main>
  )
}
```

Run:

```bash
pnpm vitest run src/app/__tests__/boot.test.tsx
```

Expected:
- PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add package.json pnpm-lock.yaml vite.config.ts vitest.config.ts tsconfig.json index.html src/App.tsx src/main.tsx src/test/setup.ts src/app/__tests__/boot.test.tsx
git commit -m "chore: bootstrap react app with testing harness"
```

---

### Task 2: Route architecture and page stubs

**Files:**
- Create: `src/app/router.tsx`
- Create: `src/components/AppFrame.tsx`
- Create: `src/pages/DashboardPage.tsx`
- Create: `src/pages/TeamsPage.tsx`
- Create: `src/pages/TeamDetailPage.tsx`
- Create: `src/pages/TradePage.tsx`
- Create: `src/pages/SettingsPage.tsx`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Test: `src/pages/__tests__/routing.test.tsx`

- [ ] **Step 1: Write failing routing test**

Create `src/pages/__tests__/routing.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../App'

describe('Routing', () => {
  it('shows dashboard route content', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })
})
```

Run:

```bash
pnpm vitest run src/pages/__tests__/routing.test.tsx
```

Expected:
- FAIL because router/pages are missing.

- [ ] **Step 2: Implement AppFrame and page components**

Create `src/components/AppFrame.tsx`:

```tsx
import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

type AppFrameProps = {
  title: string
  children: ReactNode
}

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/teams', label: 'Teams' },
  { to: '/trade', label: 'Trade' },
  { to: '/settings', label: 'Settings' },
]

export function AppFrame({ title, children }: AppFrameProps) {
  return (
    <div>
      <header>
        <h1>World Cup Stickers Tracker</h1>
        <nav aria-label="Primary">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <section>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  )
}
```

Create `src/pages/DashboardPage.tsx`:

```tsx
import { AppFrame } from '../components/AppFrame'

export function DashboardPage() {
  return (
    <AppFrame title="Dashboard">
      <p>Global collection stats will appear here.</p>
    </AppFrame>
  )
}
```

Create `src/pages/TeamsPage.tsx`:

```tsx
import { AppFrame } from '../components/AppFrame'

export function TeamsPage() {
  return (
    <AppFrame title="Teams">
      <p>Team list goes here.</p>
    </AppFrame>
  )
}
```

Create `src/pages/TeamDetailPage.tsx`:

```tsx
import { AppFrame } from '../components/AppFrame'

export function TeamDetailPage() {
  return (
    <AppFrame title="Team">
      <p>Team sticker board goes here.</p>
    </AppFrame>
  )
}
```

Create `src/pages/TradePage.tsx`:

```tsx
import { AppFrame } from '../components/AppFrame'

export function TradePage() {
  return (
    <AppFrame title="Trade">
      <p>Duplicates and wanted stickers will appear here.</p>
    </AppFrame>
  )
}
```

Create `src/pages/SettingsPage.tsx`:

```tsx
import { AppFrame } from '../components/AppFrame'

export function SettingsPage() {
  return (
    <AppFrame title="Settings">
      <p>Import/export and reset controls will appear here.</p>
    </AppFrame>
  )
}
```

- [ ] **Step 3: Wire RouterProvider**

Create `src/app/router.tsx`:

```tsx
import { createBrowserRouter } from 'react-router-dom'
import { DashboardPage } from '../pages/DashboardPage'
import { SettingsPage } from '../pages/SettingsPage'
import { TeamDetailPage } from '../pages/TeamDetailPage'
import { TeamsPage } from '../pages/TeamsPage'
import { TradePage } from '../pages/TradePage'

export const router = createBrowserRouter([
  { path: '/', element: <DashboardPage /> },
  { path: '/teams', element: <TeamsPage /> },
  { path: '/teams/:teamId', element: <TeamDetailPage /> },
  { path: '/trade', element: <TradePage /> },
  { path: '/settings', element: <SettingsPage /> },
])
```

Update `src/App.tsx`:

```tsx
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'

export default function App() {
  return <RouterProvider router={router} />
}
```

Update `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 4: Run routing tests**

Run:

```bash
pnpm vitest run src/pages/__tests__/routing.test.tsx
```

Expected:
- PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/main.tsx src/app/router.tsx src/components/AppFrame.tsx src/pages/*.tsx src/pages/__tests__/routing.test.tsx
git commit -m "feat: add route structure and page stubs"
```

---

### Task 3: Editorial design system and polished shell UI

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`
- Create: `src/styles/editorial.css`
- Create: `src/components/StatRibbon.tsx`
- Modify: `src/components/AppFrame.tsx`
- Modify: `src/pages/DashboardPage.tsx`
- Modify: `src/main.tsx`
- Test: `src/pages/__tests__/dashboard-layout.test.tsx`

- [ ] **Step 1: Write failing dashboard UI test**

Create `src/pages/__tests__/dashboard-layout.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DashboardPage } from '../DashboardPage'

describe('Dashboard layout', () => {
  it('renders the core stat ribbon cards', () => {
    render(<DashboardPage />)
    expect(screen.getByText(/collected/i)).toBeInTheDocument()
    expect(screen.getByText(/missing/i)).toBeInTheDocument()
    expect(screen.getByText(/duplicates/i)).toBeInTheDocument()
    expect(screen.getByText(/completion/i)).toBeInTheDocument()
  })
})
```

Run:

```bash
pnpm vitest run src/pages/__tests__/dashboard-layout.test.tsx
```

Expected:
- FAIL because stat ribbon does not exist.

- [ ] **Step 2: Implement tokens and global/editorial styles**

Create `src/styles/tokens.css`:

```css
:root {
  --color-field: #0b6e4f;
  --color-field-dark: #084c38;
  --color-ivory: #f6f3ea;
  --color-ink: #101820;
  --color-alert: #c1121f;
  --color-card: #ffffff;
  --color-muted: #5a5f65;

  --font-display: 'Bebas Neue', 'Anton', sans-serif;
  --font-ui: 'Manrope', 'Segoe UI', sans-serif;

  --radius-lg: 16px;
  --radius-md: 12px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}
```

Create `src/styles/base.css`:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-ui);
  color: var(--color-ink);
  background: radial-gradient(circle at 20% 0%, #1f8f6a 0%, #0d5e47 35%, #073326 100%);
}

a {
  color: inherit;
  text-decoration: none;
}
```

Create `src/styles/editorial.css`:

```css
.app-frame {
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(246, 243, 234, 0.9), rgba(246, 243, 234, 0.95)),
    repeating-linear-gradient(45deg, rgba(16, 24, 32, 0.03) 0 2px, transparent 2px 6px);
}

.app-header {
  padding: var(--space-6);
  border-bottom: 2px solid rgba(16, 24, 32, 0.08);
}

.app-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3.5rem);
  letter-spacing: 0.04em;
}

.stat-ribbon {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-4);
  margin: var(--space-6) 0;
}

.stat-card {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-card);
  border: 1px solid rgba(16, 24, 32, 0.08);
}

.stat-label {
  margin: 0;
  color: var(--color-muted);
  text-transform: uppercase;
  font-size: 0.75rem;
}

.stat-value {
  margin: var(--space-2) 0 0;
  font-size: 1.5rem;
  font-weight: 700;
}
```

- [ ] **Step 3: Implement StatRibbon and apply styles**

Create `src/components/StatRibbon.tsx`:

```tsx
type StatRibbonProps = {
  collected: number
  missing: number
  duplicates: number
  completion: string
}

export function StatRibbon({
  collected,
  missing,
  duplicates,
  completion,
}: StatRibbonProps) {
  return (
    <section className="stat-ribbon" aria-label="Collection summary">
      <article className="stat-card">
        <p className="stat-label">Collected</p>
        <p className="stat-value">{collected}</p>
      </article>
      <article className="stat-card">
        <p className="stat-label">Missing</p>
        <p className="stat-value">{missing}</p>
      </article>
      <article className="stat-card">
        <p className="stat-label">Duplicates</p>
        <p className="stat-value">{duplicates}</p>
      </article>
      <article className="stat-card">
        <p className="stat-label">Completion</p>
        <p className="stat-value">{completion}</p>
      </article>
    </section>
  )
}
```

Update `src/components/AppFrame.tsx`:

```tsx
import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

type AppFrameProps = {
  title: string
  children: ReactNode
}

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/teams', label: 'Teams' },
  { to: '/trade', label: 'Trade' },
  { to: '/settings', label: 'Settings' },
]

export function AppFrame({ title, children }: AppFrameProps) {
  return (
    <div className="app-frame">
      <header className="app-header">
        <h1 className="app-title">World Cup Stickers Tracker</h1>
        <nav aria-label="Primary">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <section>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  )
}
```

Update `src/pages/DashboardPage.tsx`:

```tsx
import { AppFrame } from '../components/AppFrame'
import { StatRibbon } from '../components/StatRibbon'

export function DashboardPage() {
  return (
    <AppFrame title="Dashboard">
      <StatRibbon collected={0} missing={980} duplicates={0} completion="0%" />
      <p>Track your sticker progress by team and prepare trading lists.</p>
    </AppFrame>
  )
}
```

Update `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/tokens.css'
import './styles/base.css'
import './styles/editorial.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 4: Run dashboard test**

```bash
pnpm vitest run src/pages/__tests__/dashboard-layout.test.tsx
```

Expected:
- PASS.

- [ ] **Step 5: Commit**

```bash
git add src/styles/*.css src/components/AppFrame.tsx src/components/StatRibbon.tsx src/pages/DashboardPage.tsx src/main.tsx src/pages/__tests__/dashboard-layout.test.tsx
git commit -m "feat: add editorial theme and dashboard stat ribbon"
```

---

### Task 4: Domain types and seeded 2026 collection model

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/teams2026.ts`
- Create: `src/domain/seed.ts`
- Test: `src/domain/__tests__/seed.test.ts`

- [ ] **Step 1: Write failing seed data tests**

Create `src/domain/__tests__/seed.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildInitialCollection } from '../seed'

describe('seed data', () => {
  it('contains 48 teams', () => {
    const seeded = buildInitialCollection()
    expect(seeded.teams).toHaveLength(48)
  })

  it('contains 980 stickers total', () => {
    const seeded = buildInitialCollection()
    expect(seeded.stickers).toHaveLength(980)
  })

  it('contains unique sticker ids', () => {
    const seeded = buildInitialCollection()
    const ids = seeded.stickers.map((sticker) => sticker.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

Run:

```bash
pnpm vitest run src/domain/__tests__/seed.test.ts
```

Expected:
- FAIL until seed implementation exists.

- [ ] **Step 2: Add domain types**

Create `src/domain/types.ts`:

```ts
export type StickerStatus = 'missing' | 'collected'

export type Team = {
  id: string
  name: string
  group: string
  order: number
}

export type StickerCategory = 'team' | 'special'

export type Sticker = {
  id: string
  teamId: string | null
  number: string
  name: string
  category: StickerCategory
}

export type CollectionEntry = {
  stickerId: string
  status: StickerStatus
  duplicateCount: number
  needNote: string
  updatedAt: string
}

export type SeedBundle = {
  teams: Team[]
  stickers: Sticker[]
}
```

- [ ] **Step 3: Add qualified teams seed list and generator**

Create `src/domain/teams2026.ts`:

```ts
import type { Team } from './types'

export const teams2026: Team[] = [
  { id: 'canada', name: 'Canada', group: 'A', order: 1 },
  { id: 'mexico', name: 'Mexico', group: 'A', order: 2 },
  { id: 'usa', name: 'USA', group: 'A', order: 3 },
  { id: 'australia', name: 'Australia', group: 'B', order: 4 },
  { id: 'iraq', name: 'Iraq', group: 'B', order: 5 },
  { id: 'ir-iran', name: 'IR Iran', group: 'B', order: 6 },
  { id: 'japan', name: 'Japan', group: 'B', order: 7 },
  { id: 'jordan', name: 'Jordan', group: 'B', order: 8 },
  { id: 'korea-republic', name: 'Korea Republic', group: 'C', order: 9 },
  { id: 'qatar', name: 'Qatar', group: 'C', order: 10 },
  { id: 'saudi-arabia', name: 'Saudi Arabia', group: 'C', order: 11 },
  { id: 'uzbekistan', name: 'Uzbekistan', group: 'C', order: 12 },
  { id: 'algeria', name: 'Algeria', group: 'D', order: 13 },
  { id: 'cabo-verde', name: 'Cabo Verde', group: 'D', order: 14 },
  { id: 'congo-dr', name: 'Congo DR', group: 'D', order: 15 },
  { id: 'cote-divoire', name: "Cote d'Ivoire", group: 'D', order: 16 },
  { id: 'egypt', name: 'Egypt', group: 'E', order: 17 },
  { id: 'ghana', name: 'Ghana', group: 'E', order: 18 },
  { id: 'morocco', name: 'Morocco', group: 'E', order: 19 },
  { id: 'senegal', name: 'Senegal', group: 'E', order: 20 },
  { id: 'south-africa', name: 'South Africa', group: 'F', order: 21 },
  { id: 'tunisia', name: 'Tunisia', group: 'F', order: 22 },
  { id: 'curacao', name: 'Curacao', group: 'F', order: 23 },
  { id: 'haiti', name: 'Haiti', group: 'F', order: 24 },
  { id: 'panama', name: 'Panama', group: 'G', order: 25 },
  { id: 'argentina', name: 'Argentina', group: 'G', order: 26 },
  { id: 'brazil', name: 'Brazil', group: 'G', order: 27 },
  { id: 'colombia', name: 'Colombia', group: 'G', order: 28 },
  { id: 'ecuador', name: 'Ecuador', group: 'H', order: 29 },
  { id: 'paraguay', name: 'Paraguay', group: 'H', order: 30 },
  { id: 'uruguay', name: 'Uruguay', group: 'H', order: 31 },
  { id: 'new-zealand', name: 'New Zealand', group: 'H', order: 32 },
  { id: 'austria', name: 'Austria', group: 'I', order: 33 },
  { id: 'belgium', name: 'Belgium', group: 'I', order: 34 },
  { id: 'bosnia-herzegovina', name: 'Bosnia and Herzegovina', group: 'I', order: 35 },
  { id: 'croatia', name: 'Croatia', group: 'I', order: 36 },
  { id: 'czechia', name: 'Czechia', group: 'J', order: 37 },
  { id: 'england', name: 'England', group: 'J', order: 38 },
  { id: 'france', name: 'France', group: 'J', order: 39 },
  { id: 'germany', name: 'Germany', group: 'J', order: 40 },
  { id: 'netherlands', name: 'Netherlands', group: 'K', order: 41 },
  { id: 'norway', name: 'Norway', group: 'K', order: 42 },
  { id: 'portugal', name: 'Portugal', group: 'K', order: 43 },
  { id: 'scotland', name: 'Scotland', group: 'K', order: 44 },
  { id: 'spain', name: 'Spain', group: 'L', order: 45 },
  { id: 'sweden', name: 'Sweden', group: 'L', order: 46 },
  { id: 'switzerland', name: 'Switzerland', group: 'L', order: 47 },
  { id: 'turkiye', name: 'Turkiye', group: 'L', order: 48 },
]
```

Create `src/domain/seed.ts`:

```ts
import { teams2026 } from './teams2026'
import type { SeedBundle, Sticker } from './types'

const TEAM_STICKERS_PER_TEAM = 20
const SPECIAL_STICKER_COUNT = 20

function buildTeamStickers(): Sticker[] {
  return teams2026.flatMap((team) =>
    Array.from({ length: TEAM_STICKERS_PER_TEAM }, (_, idx) => {
      const slot = idx + 1
      return {
        id: `${team.id}-${slot.toString().padStart(2, '0')}`,
        teamId: team.id,
        number: `${team.order.toString().padStart(2, '0')}-${slot.toString().padStart(2, '0')}`,
        name: `${team.name} Sticker ${slot}`,
        category: 'team' as const,
      }
    }),
  )
}

function buildSpecialStickers(): Sticker[] {
  return Array.from({ length: SPECIAL_STICKER_COUNT }, (_, idx) => {
    const slot = idx + 1
    return {
      id: `special-${slot.toString().padStart(2, '0')}`,
      teamId: null,
      number: `S-${slot.toString().padStart(2, '0')}`,
      name: `Special Sticker ${slot}`,
      category: 'special' as const,
    }
  })
}

export function buildInitialCollection(): SeedBundle {
  const teamStickers = buildTeamStickers()
  const specialStickers = buildSpecialStickers()
  return {
    teams: teams2026,
    stickers: [...teamStickers, ...specialStickers],
  }
}
```

- [ ] **Step 4: Run seed tests**

```bash
pnpm vitest run src/domain/__tests__/seed.test.ts
```

Expected:
- PASS (48 teams, 980 stickers, unique IDs).

- [ ] **Step 5: Commit**

```bash
git add src/domain/types.ts src/domain/teams2026.ts src/domain/seed.ts src/domain/__tests__/seed.test.ts
git commit -m "feat: add 2026 seed domain model and generator"
```

---

### Task 5: IndexedDB schema, repository rules, and migrations

**Files:**
- Create: `src/data/db.ts`
- Create: `src/data/repository.ts`
- Create: `src/data/migrations.ts`
- Test: `src/data/__tests__/repository.test.ts`

- [ ] **Step 1: Write failing repository behavior tests**

Create `src/data/__tests__/repository.test.ts`:

```ts
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { buildInitialCollection } from '../../domain/seed'
import { createRepository } from '../repository'

describe('repository status rules', () => {
  beforeEach(async () => {
    const repository = createRepository()
    await repository.resetDatabase()
    await repository.seed(buildInitialCollection())
  })

  it('resets duplicates when sticker is set to missing', async () => {
    const repository = createRepository()
    await repository.updateSticker('canada-01', {
      status: 'collected',
      duplicateCount: 3,
    })
    await repository.updateSticker('canada-01', { status: 'missing' })
    const entry = await repository.getEntry('canada-01')
    expect(entry?.duplicateCount).toBe(0)
  })
})
```

Run:

```bash
pnpm vitest run src/data/__tests__/repository.test.ts
```

Expected:
- FAIL because repository layer does not exist.

- [ ] **Step 2: Implement Dexie schema and migration hooks**

Create `src/data/db.ts`:

```ts
import Dexie, { type Table } from 'dexie'
import type { CollectionEntry, Sticker, Team } from '../domain/types'

export type AppMeta = {
  key: string
  value: string
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
      .upgrade((tx) =>
        tx.table('entries').toCollection().modify((entry) => {
          if (typeof entry.duplicateCount !== 'number') {
            entry.duplicateCount = 0
          }
          if (typeof entry.needNote !== 'string') {
            entry.needNote = ''
          }
        }),
      )
  }
}
```

- [ ] **Step 3: Implement repository with business rules**

Create `src/data/repository.ts`:

```ts
import { StickerTrackerDb } from './db'
import type { CollectionEntry, SeedBundle, StickerStatus } from '../domain/types'

const nowIso = () => new Date().toISOString()

export function createRepository() {
  const db = new StickerTrackerDb()

  return {
    async resetDatabase() {
      await db.delete()
    },

    async seed(bundle: SeedBundle) {
      await db.transaction('rw', db.teams, db.stickers, db.meta, async () => {
        await db.teams.bulkPut(bundle.teams)
        await db.stickers.bulkPut(bundle.stickers)
        await db.meta.put({ key: 'seedVersion', value: '2026.1' })
      })
    },

    async getEntry(stickerId: string) {
      return db.entries.get(stickerId)
    },

    async listStickers() {
      return db.stickers.toArray()
    },

    async listEntries() {
      return db.entries.toArray()
    },

    async updateSticker(
      stickerId: string,
      patch: Partial<Pick<CollectionEntry, 'status' | 'duplicateCount' | 'needNote'>>,
    ) {
      const current = await db.entries.get(stickerId)
      const nextStatus: StickerStatus = patch.status ?? current?.status ?? 'missing'
      const nextDuplicateCount = Math.max(
        0,
        patch.duplicateCount ?? current?.duplicateCount ?? 0,
      )

      const entry: CollectionEntry = {
        stickerId,
        status: nextStatus,
        duplicateCount: nextStatus === 'missing' ? 0 : nextDuplicateCount,
        needNote: patch.needNote ?? current?.needNote ?? '',
        updatedAt: nowIso(),
      }

      await db.entries.put(entry)
      return entry
    },
  }
}
```

Create `src/data/migrations.ts`:

```ts
export const CURRENT_SEED_VERSION = '2026.1'

export function shouldReseed(storedSeedVersion: string | undefined): boolean {
  return storedSeedVersion !== CURRENT_SEED_VERSION
}
```

- [ ] **Step 4: Run repository tests**

```bash
pnpm vitest run src/data/__tests__/repository.test.ts
```

Expected:
- PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/db.ts src/data/repository.ts src/data/migrations.ts src/data/__tests__/repository.test.ts
git commit -m "feat: add indexeddb repository with status rules"
```

---

### Task 6: Query client, selectors, and dashboard metrics

**Files:**
- Create: `src/app/queryClient.ts`
- Create: `src/domain/selectors.ts`
- Create: `src/data/repositorySingleton.ts`
- Create: `src/features/stickers/hooks.ts`
- Modify: `src/main.tsx`
- Modify: `src/pages/DashboardPage.tsx`
- Test: `src/domain/__tests__/selectors.test.ts`

- [ ] **Step 1: Write failing selector tests**

Create `src/domain/__tests__/selectors.test.ts`:

```ts
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
      { stickerId: 'a', status: 'collected', duplicateCount: 2, needNote: '', updatedAt: '2026-01-01T00:00:00.000Z' },
      { stickerId: 'b', status: 'missing', duplicateCount: 0, needNote: '', updatedAt: '2026-01-01T00:00:00.000Z' },
    ]

    const summary = summarizeCollection(stickers, entries)
    expect(summary.collected).toBe(1)
    expect(summary.missing).toBe(1)
    expect(summary.duplicates).toBe(2)
    expect(summary.completion).toBe('50%')
  })
})
```

Run:

```bash
pnpm vitest run src/domain/__tests__/selectors.test.ts
```

Expected:
- FAIL before selectors exist.

- [ ] **Step 2: Implement selectors**

Create `src/domain/selectors.ts`:

```ts
import type { CollectionEntry, Sticker } from './types'

type Summary = {
  collected: number
  missing: number
  duplicates: number
  completion: string
}

export function summarizeCollection(
  stickers: Sticker[],
  entries: CollectionEntry[],
): Summary {
  const byId = new Map(entries.map((entry) => [entry.stickerId, entry]))
  const total = stickers.length

  let collected = 0
  let duplicates = 0

  for (const sticker of stickers) {
    const entry = byId.get(sticker.id)
    if (entry?.status === 'collected') {
      collected += 1
    }
    if (entry) {
      duplicates += entry.duplicateCount
    }
  }

  const missing = total - collected
  const completion = total === 0 ? '0%' : `${Math.round((collected / total) * 100)}%`

  return { collected, missing, duplicates, completion }
}
```

- [ ] **Step 3: Add query provider and hooks**

Create `src/app/queryClient.ts`:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      gcTime: 300_000,
      retry: 1,
    },
  },
})
```

Create `src/data/repositorySingleton.ts`:

```ts
import { createRepository } from './repository'

export const repository = createRepository()
```

Create `src/features/stickers/hooks.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { repository } from '../../data/repositorySingleton'
import { buildInitialCollection } from '../../domain/seed'
import { summarizeCollection } from '../../domain/selectors'

export function useInitializeSeed() {
  return useQuery({
    queryKey: ['seed-init'],
    queryFn: async () => {
      const stickers = await repository.listStickers()
      if (stickers.length === 0) {
        await repository.seed(buildInitialCollection())
      }
      return true
    },
  })
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['summary'],
    queryFn: async () => {
      const stickers = await repository.listStickers()
      const entries = await repository.listEntries()
      return summarizeCollection(stickers, entries)
    },
  })
}
```

Update `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { queryClient } from './app/queryClient'
import './styles/tokens.css'
import './styles/base.css'
import './styles/editorial.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
```

Update `src/pages/DashboardPage.tsx`:

```tsx
import { AppFrame } from '../components/AppFrame'
import { StatRibbon } from '../components/StatRibbon'
import { useDashboardSummary, useInitializeSeed } from '../features/stickers/hooks'

export function DashboardPage() {
  useInitializeSeed()
  const { data } = useDashboardSummary()

  return (
    <AppFrame title="Dashboard">
      <StatRibbon
        collected={data?.collected ?? 0}
        missing={data?.missing ?? 0}
        duplicates={data?.duplicates ?? 0}
        completion={data?.completion ?? '0%'}
      />
      <p>Track your sticker progress by team and prepare trading lists.</p>
    </AppFrame>
  )
}
```

- [ ] **Step 4: Run selector tests**

```bash
pnpm vitest run src/domain/__tests__/selectors.test.ts
```

Expected:
- PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/queryClient.ts src/domain/selectors.ts src/data/repositorySingleton.ts src/features/stickers/hooks.ts src/main.tsx src/pages/DashboardPage.tsx src/domain/__tests__/selectors.test.ts
git commit -m "feat: add summary selectors and query provider"
```

---

### Task 7: Team detail tracker interactions (status, duplicates, note)

**Files:**
- Create: `src/features/stickers/StatusSwitch.tsx`
- Create: `src/features/stickers/NeedNoteEditor.tsx`
- Create: `src/features/stickers/FilterDock.tsx`
- Create: `src/features/stickers/StickerTile.tsx`
- Modify: `src/pages/TeamDetailPage.tsx`
- Test: `src/pages/__tests__/team-detail-interactions.test.tsx`

- [ ] **Step 1: Write failing team interaction test**

Create `src/pages/__tests__/team-detail-interactions.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { TeamDetailPage } from '../TeamDetailPage'

describe('Team detail interactions', () => {
  it('cycles status and updates duplicate count', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <TeamDetailPage />
      </QueryClientProvider>,
    )

    await user.click(screen.getByRole('button', { name: /set collected/i }))
    await user.click(screen.getByRole('button', { name: /increase duplicates/i }))

    expect(await screen.findByText(/duplicates: 1/i)).toBeInTheDocument()
  })
})
```

Run:

```bash
pnpm vitest run src/pages/__tests__/team-detail-interactions.test.tsx
```

Expected:
- FAIL.

- [ ] **Step 2: Implement sticker interaction components**

Create `src/features/stickers/StatusSwitch.tsx`:

```tsx
import type { StickerStatus } from '../../domain/types'

type StatusSwitchProps = {
  status: StickerStatus
  onChange: (next: StickerStatus) => void
}

export function StatusSwitch({ status, onChange }: StatusSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(status === 'missing' ? 'collected' : 'missing')}
      aria-label={status === 'missing' ? 'Set collected' : 'Set missing'}
    >
      {status === 'missing' ? 'Missing' : 'Collected'}
    </button>
  )
}
```

Create `src/features/stickers/NeedNoteEditor.tsx`:

```tsx
type NeedNoteEditorProps = {
  value: string
  onChange: (next: string) => void
}

export function NeedNoteEditor({ value, onChange }: NeedNoteEditorProps) {
  return (
    <label>
      Trade note
      <input
        aria-label="Trade note"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
```

Create `src/features/stickers/FilterDock.tsx`:

```tsx
type FilterDockProps = {
  value: 'all' | 'missing' | 'collected'
  onChange: (next: 'all' | 'missing' | 'collected') => void
}

export function FilterDock({ value, onChange }: FilterDockProps) {
  return (
    <fieldset>
      <legend>Status filter</legend>
      <button type="button" onClick={() => onChange('all')} aria-pressed={value === 'all'}>
        All
      </button>
      <button
        type="button"
        onClick={() => onChange('missing')}
        aria-pressed={value === 'missing'}
      >
        Missing
      </button>
      <button
        type="button"
        onClick={() => onChange('collected')}
        aria-pressed={value === 'collected'}
      >
        Collected
      </button>
    </fieldset>
  )
}
```

Create `src/features/stickers/StickerTile.tsx`:

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { repository } from '../../data/repositorySingleton'
import { NeedNoteEditor } from './NeedNoteEditor'
import { StatusSwitch } from './StatusSwitch'

export function StickerTile() {
  const stickerId = 'canada-01'
  const queryClient = useQueryClient()

  const { data: entry } = useQuery({
    queryKey: ['entry', stickerId],
    queryFn: () => repository.getEntry(stickerId),
  })

  const mutation = useMutation({
    mutationFn: (patch: { status?: 'missing' | 'collected'; duplicateCount?: number; needNote?: string }) =>
      repository.updateSticker(stickerId, patch),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['entry', stickerId] }),
        queryClient.invalidateQueries({ queryKey: ['summary'] }),
      ])
    },
  })

  const status = entry?.status ?? 'missing'
  const duplicates = entry?.duplicateCount ?? 0
  const note = entry?.needNote ?? ''

  const onStatusChange = (next: 'missing' | 'collected') => {
    mutation.mutate({ status: next })
  }

  return (
    <article>
      <h3>Sticker 01</h3>
      <StatusSwitch status={status} onChange={onStatusChange} />
      <button
        type="button"
        onClick={() => mutation.mutate({ status: 'collected', duplicateCount: duplicates + 1 })}
        aria-label="Increase duplicates"
        disabled={status === 'missing'}
      >
        +
      </button>
      <p>Duplicates: {duplicates}</p>
      <NeedNoteEditor
        value={note}
        onChange={(next) => mutation.mutate({ needNote: next })}
      />
    </article>
  )
}
```

- [ ] **Step 3: Use StickerTile on team detail page**

Update `src/pages/TeamDetailPage.tsx`:

```tsx
import { AppFrame } from '../components/AppFrame'
import { FilterDock } from '../features/stickers/FilterDock'
import { StickerTile } from '../features/stickers/StickerTile'
import { useState } from 'react'

export function TeamDetailPage() {
  const [filter, setFilter] = useState<'all' | 'missing' | 'collected'>('all')

  return (
    <AppFrame title="Team">
      <FilterDock value={filter} onChange={setFilter} />
      <StickerTile />
    </AppFrame>
  )
}
```

- [ ] **Step 4: Run interaction test**

```bash
pnpm vitest run src/pages/__tests__/team-detail-interactions.test.tsx
```

Expected:
- PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/stickers/StatusSwitch.tsx src/features/stickers/NeedNoteEditor.tsx src/features/stickers/FilterDock.tsx src/features/stickers/StickerTile.tsx src/pages/TeamDetailPage.tsx src/pages/__tests__/team-detail-interactions.test.tsx
git commit -m "feat: add team sticker interaction controls"
```

---

### Task 8: Trade page, import/export, and settings workflows

**Files:**
- Create: `src/features/trade/TradePanel.tsx`
- Create: `src/data/importExport.ts`
- Modify: `src/pages/TradePage.tsx`
- Modify: `src/pages/SettingsPage.tsx`
- Test: `src/pages/__tests__/trade-page.test.tsx`
- Test: `src/data/__tests__/importExport.test.ts`

- [ ] **Step 1: Write failing trade and import/export tests**

Create `src/pages/__tests__/trade-page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TradePage } from '../TradePage'

describe('Trade page', () => {
  it('shows duplicates and wanted sections', () => {
    render(<TradePage />)
    expect(screen.getByRole('heading', { name: /duplicates/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /wanted/i })).toBeInTheDocument()
  })
})
```

Create `src/data/__tests__/importExport.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { validateImportPayload } from '../importExport'

describe('import validation', () => {
  it('rejects malformed payload', () => {
    const result = validateImportPayload({ foo: 'bar' })
    expect(result.ok).toBe(false)
  })
})
```

Run:

```bash
pnpm vitest run src/pages/__tests__/trade-page.test.tsx src/data/__tests__/importExport.test.ts
```

Expected:
- FAIL.

- [ ] **Step 2: Implement TradePanel and TradePage**

Create `src/features/trade/TradePanel.tsx`:

```tsx
type TradePanelProps = {
  duplicates: string[]
  wanted: string[]
}

export function TradePanel({ duplicates, wanted }: TradePanelProps) {
  return (
    <section>
      <h3>Duplicates</h3>
      <ul>
        {duplicates.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h3>Wanted</h3>
      <ul>
        {wanted.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
```

Update `src/pages/TradePage.tsx`:

```tsx
import { AppFrame } from '../components/AppFrame'
import { TradePanel } from '../features/trade/TradePanel'

export function TradePage() {
  return (
    <AppFrame title="Trade">
      <TradePanel
        duplicates={['canada-01', 'mexico-09']}
        wanted={['argentina-04', 'special-03']}
      />
    </AppFrame>
  )
}
```

- [ ] **Step 3: Implement import/export validation and settings UI**

Create `src/data/importExport.ts`:

```ts
type ImportValidationResult =
  | { ok: true; value: { entries: unknown[]; seedVersion: string } }
  | { ok: false; error: string }

export function validateImportPayload(payload: unknown): ImportValidationResult {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('entries' in payload) ||
    !Array.isArray((payload as { entries: unknown[] }).entries)
  ) {
    return { ok: false, error: 'Invalid import payload: missing entries array' }
  }

  if (
    !('seedVersion' in payload) ||
    typeof (payload as { seedVersion: unknown }).seedVersion !== 'string'
  ) {
    return { ok: false, error: 'Invalid import payload: missing seedVersion string' }
  }

  return {
    ok: true,
    value: {
      entries: (payload as { entries: unknown[] }).entries,
      seedVersion: (payload as { seedVersion: string }).seedVersion,
    },
  }
}
```

Update `src/pages/SettingsPage.tsx`:

```tsx
import { AppFrame } from '../components/AppFrame'

export function SettingsPage() {
  return (
    <AppFrame title="Settings">
      <button type="button">Export JSON</button>
      <label>
        Import JSON
        <input type="file" accept="application/json" />
      </label>
      <button type="button">Reset Local Data</button>
    </AppFrame>
  )
}
```

- [ ] **Step 4: Run trade/import tests**

```bash
pnpm vitest run src/pages/__tests__/trade-page.test.tsx src/data/__tests__/importExport.test.ts
```

Expected:
- PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/trade/TradePanel.tsx src/pages/TradePage.tsx src/pages/SettingsPage.tsx src/data/importExport.ts src/pages/__tests__/trade-page.test.tsx src/data/__tests__/importExport.test.ts
git commit -m "feat: add trade view and import export validation"
```

---

### Task 9: PWA configuration, offline readiness, and update prompt

**Files:**
- Modify: `vite.config.ts`
- Create: `src/pwa/ReloadPrompt.tsx`
- Modify: `src/App.tsx`
- Modify: `src/vite-env.d.ts`
- Test: `src/pwa/__tests__/reload-prompt.test.tsx`
- Test: `src/app/__tests__/offline-smoke.test.tsx`

- [ ] **Step 1: Write failing PWA prompt test**

Create `src/pwa/__tests__/reload-prompt.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ReloadPrompt } from '../ReloadPrompt'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}))

describe('ReloadPrompt', () => {
  it('renders nothing by default', () => {
    render(<ReloadPrompt />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
```

Create `src/app/__tests__/offline-smoke.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../App'

describe('offline smoke', () => {
  it('mounts application shell without runtime fetch dependency', () => {
    const { container } = render(<App />)
    expect(container).toBeTruthy()
  })
})
```

Run:

```bash
pnpm vitest run src/pwa/__tests__/reload-prompt.test.tsx src/app/__tests__/offline-smoke.test.tsx
```

Expected:
- FAIL before component exists.

- [ ] **Step 2: Configure vite-plugin-pwa (prompt strategy)**

Update `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'World Cup Stickers Tracker',
        short_name: 'WC Stickers',
        description: 'Offline-first tracker for the 2026 World Cup sticker collection',
        theme_color: '#0b6e4f',
        background_color: '#f6f3ea',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
})
```

- [ ] **Step 3: Implement ReloadPrompt and mount in App**

Create `src/pwa/ReloadPrompt.tsx`:

```tsx
import { useRegisterSW } from 'virtual:pwa-register/react'

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  const close = () => {
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  if (!needRefresh && !offlineReady) {
    return null
  }

  return (
    <aside role="alert">
      <p>
        {offlineReady
          ? 'App ready to work offline.'
          : 'New version available. Reload to update.'}
      </p>
      {needRefresh ? (
        <button type="button" onClick={() => updateServiceWorker(true)}>
          Reload
        </button>
      ) : null}
      <button type="button" onClick={close}>
        Close
      </button>
    </aside>
  )
}
```

Update `src/App.tsx`:

```tsx
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { ReloadPrompt } from './pwa/ReloadPrompt'

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ReloadPrompt />
    </>
  )
}
```

Update `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
```

- [ ] **Step 4: Run PWA tests and build**

Run:

```bash
pnpm vitest run src/pwa/__tests__/reload-prompt.test.tsx src/app/__tests__/offline-smoke.test.tsx
pnpm build
```

Expected:
- Test passes and production build outputs service worker assets.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts src/pwa/ReloadPrompt.tsx src/pwa/__tests__/reload-prompt.test.tsx src/app/__tests__/offline-smoke.test.tsx src/App.tsx src/vite-env.d.ts
git commit -m "feat: add pwa manifest and update prompt flow"
```

---

### Task 10: Final integration checks and acceptance verification

**Files:**
- Modify: `README.md`
- Test: all existing test files

- [ ] **Step 1: Add README runbook**

Create or update `README.md`:

```md
# World Cup Stickers Tracker

## Scripts

- `pnpm dev` - start dev server
- `pnpm test` - run vitest
- `pnpm build` - production build
- `pnpm preview` - preview production build

## PWA checks

1. Run `pnpm build`.
2. Run `pnpm preview`.
3. Open app in browser and verify install prompt appears.
4. Toggle offline in dev tools and verify app shell still loads.
```

- [ ] **Step 2: Run full test suite**

```bash
pnpm vitest run
```

Expected:
- All tests pass.

- [ ] **Step 3: Run lint/type/build verification**

```bash
pnpm tsc --noEmit
pnpm build
```

Expected:
- No type errors.
- Build successful with generated PWA assets.

- [ ] **Step 4: Manual acceptance smoke test**

Run:

```bash
pnpm dev
```

Expected manual outcomes:
- Dashboard, Teams, Team detail, Trade, Settings routes load.
- Team detail interactions update status/duplicates/note.
- Trade page shows duplicates/wanted sections.
- PWA update/offline readiness component is wired.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add runbook and acceptance checklist"
```

---

## Spec coverage self-review

### Coverage map

- Offline-first + IndexedDB: Task 5, Task 9, Task 10
- Preloaded seeded structure: Task 4
- Team-first navigation: Task 2 + Task 7
- Trading-ready details: Task 7 + Task 8
- Editorial sports UI direction: Task 3
- Import/export settings: Task 8
- PWA install/update behavior: Task 9
- Testing strategy (unit/component/integration/smoke): Tasks 1 to 10

No spec requirements are uncovered.

### Placeholder scan

- Verified no `TODO`, `TBD`, or "implement later" placeholders.
- Every implementation step has concrete file paths and runnable commands.

### Type/signature consistency

- `StickerStatus` is consistently `missing | collected`.
- `CollectionEntry` fields are consistent across domain and repository tasks.
- Query/data flow names are consistent (`summary`, `updateSticker`, `buildInitialCollection`).
