# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # dev server
pnpm test         # run all tests (vitest run)
pnpm test:ui      # vitest UI
pnpm tsc --noEmit # type-check only
pnpm build        # tsc + vite build
pnpm preview      # preview production build
```

Run single test file: `pnpm vitest run src/path/to/file.test.ts`

## Architecture

Offline-first PWA — 2026 World Cup sticker collection tracker. No backend; all data in IndexedDB.

**Stack**: React 19, TypeScript, Vite, React Query (TanStack Query v5), Dexie (IndexedDB), React Router v7.

### Layers

```
src/domain/     Pure functions, no I/O. Types, progress math, seed data.
src/data/       Dexie DB + Repository pattern. All IndexedDB access here.
src/features/   UI components + hooks grouped by feature (stickers, trade).
src/pages/      Route-level components; compose features.
src/app/        Router, QueryClient, Providers setup.
```

### Data flow

- `repository` singleton (`src/data/repositorySingleton.ts`) is the single I/O interface.
- All reads go through React Query hooks → `repository.*` → Dexie.
- Mutations: call `repository.updateSticker(...)`, then `queryClient.invalidateQueries(...)`.
- No Zustand/Redux — React Query is the only state layer.

### DB schema & migrations

`StickerTrackerDb` in `src/data/db.ts` uses Dexie versioning. Add new versions inline in the constructor. Migrations run via `.upgrade()` callbacks.

### Domain model

- `CollectionEntry`: `{ stickerId, status: 'missing'|'collected', duplicateCount, needNote, updatedAt }`
- `duplicateCount` = extras beyond the one collected copy (0 = have exactly 1).
- Use `toStickerCopies` / `fromStickerCopies` in `src/domain/progress.ts` when converting between "copies owned" and the stored model.
- Seed data lives in `src/domain/teams2026.ts` → assembled in `src/domain/seed.ts`.

### Testing

- jsdom environment with `fake-indexeddb/auto` (auto-patches IndexedDB globally in `src/test/setup.ts`).
- `virtual:pwa-register/react` is mocked via vitest alias — don't import the real module in tests.
- Integration tests can use the real repository (fake-indexeddb is transparent).

### Scroll

Page scroll is on `window`, not a `.page-scroll` container. Use `window.scrollY` / `window.scrollTo()`.
