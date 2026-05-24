# Share Missing Stickers

**Date:** 2026-05-24  
**Status:** Approved

## Overview

Share all missing stickers grouped by team via the native Web Share API, triggered from a button on the Dashboard. Implementation is reusable to support a future per-team share button.

## Data Layer

### `src/domain/share.ts`

New pure function:

```ts
buildMissingByTeam(
  teams: Team[],
  stickers: Sticker[],
  entries: CollectionEntry[],
  teamId?: string,  // optional filter for single-team share
): { team: Team; missingNumbers: string[] }[]
```

- Filters stickers with no collected entry
- When `teamId` provided, restricts to that team only
- Sorts teams: group → order → name (matches TeamsPage sort)
- Returns only teams with ≥1 missing sticker

### `src/features/stickers/useShareMissing.ts`

Hook that encapsulates fetch + format + share:

```ts
useShareMissing(teamId?: string): { share: () => Promise<void>; isLoading: boolean }
```

- Fetches teams/stickers/entries from `repository`
- Calls `buildMissingByTeam`
- Formats output text — one line per team:
  ```
  Brazil 🇧🇷: #03, #07, #12
  Argentina 🇦🇷: #01, #04
  ```
- Zero missing: shares "All stickers collected! 🎉"
- Calls `navigator.share({ text })`
- Desktop fallback (no `navigator.share`): copies to clipboard, brief "Copied!" feedback

## UI

### Dashboard top bar

Share button added to sticky top bar alongside existing stats.

- Label: **SHARE MISSING**
- Disabled + loading state while fetching
- Calls `useShareMissing()` with no `teamId` (all teams)

## Future Team-Level Share

`buildMissingByTeam` accepts optional `teamId`. Future per-team button passes the team's id — same hook, same formatter, no redesign needed.

## Files Touched

| File | Change |
|------|--------|
| `src/domain/share.ts` | New — `buildMissingByTeam` pure function |
| `src/domain/__tests__/share.test.ts` | New — unit tests for pure function |
| `src/features/stickers/useShareMissing.ts` | New — hook |
| `src/pages/DashboardPage.tsx` | Add share button to top bar |
