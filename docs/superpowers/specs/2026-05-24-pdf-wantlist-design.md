# PDF Wantlist — Design Spec

**Date:** 2026-05-24  
**Scope:** Album-wide PDF download of missing stickers (single-team mode deferred)

---

## Goal

Replace the text-copy "SHARE MISSING" button on the Dashboard with a PDF download. The PDF is a styled A4 wantlist matching the app's editorial aesthetic — cream background, bold display typography, flag images, sticker chips, and per-team count badges.

## Excluded (explicit)

- Shared-by attribution (name, handle)
- Count cards (missing total, teams needed, complete count)
- "DM to trade" button
- Single-team mode (deferred)

---

## Architecture

Three new/changed files:

| File | Role |
|---|---|
| `src/features/stickers/WantlistPdf.tsx` | `@react-pdf/renderer` document component — pure presentation, no I/O |
| `src/features/stickers/useGeneratePdf.ts` | Hook — fetches data, builds PDF blob, triggers download |
| `src/pages/DashboardPage.tsx` | Edit — swap `useShareMissing` for `useGeneratePdf` on the share button |

`useShareMissing` and `domain/share.ts` stay untouched.

---

## Data Flow

```
useGeneratePdf.generate()
  → repository.listTeams() + listStickers() + listEntries()  [parallel]
  → buildMissingByTeam(teams, stickers, entries)             [domain/share.ts, reused]
  → compute stickersByTeam map (teamId → total count)
  → build WantlistTeamData[]
  → pdf(<WantlistDocument />).toBlob()
  → URL.createObjectURL → <a download> click → revoke
```

### WantlistTeamData type

```ts
type WantlistTeamData = {
  team: Team          // from domain/types
  total: number       // total stickers for this team
  missingNumbers: string[]  // sticker.number strings
}
```

---

## PDF Layout

**Library:** `@react-pdf/renderer` (latest), installed via pnpm.

**Page:** A4 portrait, `#F8F1DE` background, 32pt horizontal / 30pt vertical padding, 50pt bottom padding (footer clearance).

### Header

```
WORLD CUP 2026 · STICKER WANTLIST          [8pt Helvetica muted, top-left]

STICKERS                                    [56pt Archivo Black solid black]
WANTED.                                     [56pt Archivo Black, outlined via SVG stroke/fill=none]

                              MAY 24, 2026  [8pt Helvetica muted, right-aligned]
```

"WANTED." rendered as `<Svg><Text fill="none" stroke="#0B0B0F" strokeWidth={1.5}>` to achieve the hollow outlined look from the reference screenshot.

### Divider

3pt solid `#0B0B0F` horizontal rule immediately below the header block.

### Team Rows

One row per team with missing stickers, sorted: group A→L, then by `team.order`.

```
[flag 52×52]  MEXICO  MEX · GRP A                          [7]
              7 OF 18 MISSING                              [LEFT]
              [#05] [#07] [#08] [#10] [#13] [#16] [#18]
```

- **Flag box:** 52×52pt, 8pt border-radius, 2.5pt solid ink border, PNG from `https://flagcdn.com/w40/{code}.png` (code extracted from existing `team.flag` SVG URL).
- **Name:** Archivo Black, 14pt, uppercase. Meta (`MEX · GRP A`) in 8pt Helvetica muted, same line baseline-aligned.
- **Subtitle:** `X OF Y MISSING` — 8pt Helvetica muted.
- **Chips:** `#05`, `#07`… — 8pt Helvetica Bold, 1.5pt solid ink border, 4pt border-radius, `flexWrap: 'wrap'`, 4pt gap.
- **Count badge:** 52×52pt, `#E83838` background, 2.5pt solid ink border, 8pt border-radius. Number in Archivo Black 20pt white; `LEFT` in 6pt Helvetica Bold white.
- **Row separator:** 1pt dashed `#6B6B72` between rows.
- **`wrap={false}`** on each row View — prevents a row splitting across pages.

### Footer (fixed, every page)

Absolute position: `bottom: 30, left: 32, right: 32`. 1pt solid ink top border.

```
PRINTED FROM STICKERS TRACKER                    PAGE 1 / 2
```

Page numbers via react-pdf `render={({ pageNumber, totalPages }) => ...}` prop on `Text`.

---

## Fonts

| Font | Usage | Registration |
|---|---|---|
| Archivo Black | Display text, team names, count numbers | `Font.register` at module top with Google Fonts TTF URL |
| Helvetica / Helvetica-Bold | All body text, chips, meta, footer | Built-in PDF font, no registration needed |

Font registration happens once at module load (`WantlistPdf.tsx` top level), before any render call.

---

## Hook API

```ts
function useGeneratePdf(): {
  generate: () => Promise<void>
  isLoading: boolean
  error: Error | null
}
```

`generate()` is idempotent — calling while `isLoading` is safe (guarded). Errors surface in `error` state; no automatic retry.

---

## Dashboard Button

Replace:
```tsx
const { share, isLoading, copied } = useShareMissing()
<button onClick={share} disabled={isLoading}>
  {copied ? 'COPIED!' : isLoading ? 'LOADING...' : 'SHARE MISSING'}
</button>
```

With:
```tsx
const { generate, isLoading } = useGeneratePdf()
<button onClick={generate} disabled={isLoading}>
  {isLoading ? 'BUILDING PDF...' : 'DOWNLOAD PDF'}
</button>
```

---

## Edge Cases

- **No missing stickers:** `buildMissingByTeam` returns `[]`; hook returns early, no PDF generated. (Optional: show brief notification — deferred, out of scope.)
- **Flag fetch failure:** react-pdf silently skips missing images; row renders without flag.
- **Font load failure:** PDF falls back to Helvetica throughout; layout unchanged.
- **Large collections (many pages):** Fixed footer repeats on all pages via `fixed` prop.
