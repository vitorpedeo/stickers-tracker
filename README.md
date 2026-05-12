# World Cup Stickers Tracker

Offline-first React + PWA app for tracking a full 2026 World Cup sticker collection with team views, duplicate tracking, and trade notes.

## Scripts

- `pnpm dev` - start local dev server
- `pnpm vitest run` - run tests
- `pnpm tsc --noEmit` - type-check
- `pnpm build` - production build
- `pnpm preview` - preview production build

## PWA checks

1. Run `pnpm build`.
2. Run `pnpm preview`.
3. Open the app and confirm the web app manifest is available and install prompt behavior appears in supported browsers.
4. In browser dev tools, set network to offline and confirm the app shell still loads.

## Core app flow

1. Open `/teams` and pick a team.
2. Toggle sticker states between missing/collected.
3. Add duplicate counts and trade notes.
4. Use `/trade` to review duplicates and wanted lists.
5. Use `/settings` for import/export/reset workflows.
