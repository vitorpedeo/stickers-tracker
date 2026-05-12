# 2026 World Cup Stickers Tracker - Design Spec

Date: 2026-05-12  
Status: Approved design, ready for implementation planning

## 1. Goal

Build a React-based PWA-ready app to track all stickers from the 2026 World Cup with:

- Offline-first local usage on a single device
- Preloaded sticker checklist structure with manual edit support
- Team-first navigation
- Trading-ready tracking (`missing/collected`, duplicate counts, trade notes)
- High-quality editorial sports dashboard visual style (non-generic UI)

## 2. Scope

### In scope (v1)

- Local-first tracking with IndexedDB persistence
- Seeded 2026 sticker dataset structure loaded on first run
- Team index and team detail tracking screens
- Dashboard with global and per-team progress stats
- Trade screen with duplicates and wanted items
- JSON import/export for backup and migration
- Installable PWA setup with offline app shell behavior

### Out of scope (v1)

- User accounts and cloud sync
- Real-time trading marketplace or matching
- Camera scan/OCR sticker recognition

## 3. Architecture

### 3.1 Stack

- React + TypeScript + Vite
- PWA support via `vite-plugin-pwa`
- IndexedDB as local source of truth
- Query/cache layer (React Query or equivalent)

### 3.2 App routes

- `/` dashboard (global progress + quick actions)
- `/teams` team index
- `/teams/:teamId` team tracker page
- `/trade` duplicates and wanted workflow
- `/settings` import/export/reset

### 3.3 Layering

- UI layer: pages/components and interaction controls
- Domain/repository layer: business rules and derived selectors
- Persistence layer: IndexedDB adapters and seed/migration logic

This boundary allows future cloud sync without rewriting core UI screens.

## 4. UI and Component Design

### 4.1 Visual direction

- Editorial sports dashboard style with bold hierarchy
- Typography:
  - Display/headline: `Bebas Neue` or `Anton`
  - UI/body: `Manrope`
- Color system:
  - Primary field green, warm ivory background, deep ink text
  - Red accents for alerts and important status cues
- Background treatment:
  - Subtle gradient + light grain texture + geometric overlays
- Motion:
  - Section stagger reveals
  - Stat count transitions
  - Sticker tile state transitions

### 4.2 Core components

- `AppFrame`: shared shell (top bar, stat strip, content area)
- `StatRibbon`: prominent KPI cards (collected, missing, duplicates, completion)
- `TeamGrid`: team cards with completion indicators
- `TeamHeader`: team summary + quick filters
- `StickerBoard`: responsive sticker tile board
- `TradePanel`: split duplicates vs wanted lists
- `StickerTile`: status toggle + duplicate stepper + note entry affordance
- `FilterDock`: status filters, search, sort controls
- `NeedNoteEditor`: per-sticker trade note editor

### 4.3 Responsive behavior

- Mobile-first layout with touch-priority interactions and bottom quick actions
- Desktop layout increases information density and parallel visibility of stats + grid

## 5. Data Model

### 5.1 Entities

- `Team`
  - `id`, `name`, `group`, `order`
- `Sticker`
  - `id`, `teamId`, `number`, `name`, `category`, optional `rarity`
- `CollectionEntry`
  - `stickerId`
  - `status`: `missing | collected`
  - `duplicateCount`: integer >= 0
  - `needNote`: short text
  - `updatedAt`: timestamp
- `AppMeta`
  - `seedVersion`, optional backup/import metadata, preferences

### 5.2 Derived metrics

- Global totals:
  - collected count, missing count, duplicate total, completion percentage
- Per team:
  - collected/total, duplicate count, completion percentage
- Trade views:
  - available duplicates (`duplicateCount > 0`)
  - wanted list (`status = missing` or note indicates wanted context)

## 6. Data Flow

### 6.1 First run

- Load seed bundle for 2026 sticker structure
- Insert teams/stickers
- Initialize app metadata with seed version
- Create `CollectionEntry` records lazily on first interaction (default `missing`, duplicates `0`, empty note)

### 6.2 User interaction flow

- User updates sticker state (status/duplicates/note)
- Repository validates business rules
- IndexedDB write completes
- Query cache invalidates/recomputes derived selectors
- UI refreshes immediately with updated stats and views

### 6.3 Import/export flow

- Export: full local state as JSON
- Import:
  - schema and version validation
  - user selects `replace` or `merge`
  - `replace`: imported state becomes source of truth
  - `merge`: newest `updatedAt` wins per sticker entry

## 7. Business Rules and Edge Cases

- `duplicateCount` cannot go below `0`
- If status is set to `missing`, duplicates are auto-reset to `0` to keep data consistent
- Notes auto-save on blur
- Seed version changes trigger deterministic migration path
- Failed migration preserves previous DB snapshot and presents recovery guidance

## 8. PWA Behavior

- Installable web app with manifest + branded icons
- Service worker caches app shell and static assets
- Core flows (tracking, filtering, trade prep) run offline after first load
- Update available flow:
  - prompt user to refresh when new service worker is ready
- If service worker registration fails, app remains usable as standard web app

## 9. Error Handling

- IndexedDB init failure:
  - blocking recovery screen with retry path
- Invalid import:
  - explicit validation errors with actionable field-level messages where possible
- Read/write failures:
  - user-visible toast/banner + retry action
- Unexpected state inconsistencies:
  - safe fallback rendering with non-destructive recovery prompt

## 10. Testing Strategy

- Unit tests:
  - repository rules, state transitions, duplicate/reset constraints, merge/replace behavior
- Component tests:
  - `StickerTile`, filters, trade panel derivations
- Integration tests:
  - first-run seeding, team tracking workflows, import/export roundtrip
- PWA checks:
  - manifest validation, service worker registration/update prompt, offline launch smoke test
- Manual QA:
  - mobile and desktop visual hierarchy, tap ergonomics, responsiveness

## 11. Acceptance Criteria

- App can be installed and opened as a PWA
- After first load, core functionality works offline
- Seeded team/sticker structure appears on first run
- Team-first browsing and tracking work end-to-end
- Each sticker supports:
  - `missing/collected`
  - duplicate count
  - trade note
- Dashboard and team progress update immediately after edits
- Trade screen clearly separates duplicates and wanted items
- JSON export/import roundtrip preserves complete collection state

## 12. Decomposition and Implementation Readiness

This scope is suitable for a single implementation plan with phased delivery:

- Foundation: app shell, routes, storage, seed
- Core tracking UX: team pages and sticker interactions
- Trade and stats views
- Settings import/export and PWA hardening
- Test coverage and QA polish

No additional decomposition is required before plan writing.
