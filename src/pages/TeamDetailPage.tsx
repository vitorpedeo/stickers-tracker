import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { AppFrame } from '../components/AppFrame'
import { repository } from '../data/repositorySingleton'
import { fromStickerCopies, toStickerCopies } from '../domain/progress'
import type { Sticker } from '../domain/types'
import { useInitializeSeed } from '../features/stickers/hooks'

function parseStickerList(input: string, maxSticker: number, minSticker = 1): number[] {
  const selected = new Set<number>()
  for (const token of input.split(',')) {
    const trimmed = token.trim()
    if (!trimmed) continue
    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/)
    if (rangeMatch) {
      const a = Number(rangeMatch[1])
      const b = Number(rangeMatch[2])
      for (let v = Math.min(a, b); v <= Math.max(a, b); v++) {
        if (v >= minSticker && v <= maxSticker) selected.add(v)
      }
      continue
    }
    const n = Number(trimmed)
    if (Number.isInteger(n) && n >= minSticker && n <= maxSticker) selected.add(n)
  }
  return Array.from(selected).sort((a, b) => a - b)
}

function ProgressRing({
  pct,
  size = 70,
  stroke = 9,
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
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#E83838" strokeWidth={stroke} strokeLinecap="butt"
        strokeDasharray={c} strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%" y="50%" dy="2" textAnchor="middle" dominantBaseline="middle"
        fontFamily="Archivo Black" fontSize={size / 3.4} fill="#0B0B0F"
      >
        {pct}%
      </text>
    </svg>
  )
}

type FilterMode = 'all' | 'missing' | 'got' | 'dupes'
type BulkMode = 'got' | 'dupe' | 'clear'

const BULK_MODE_OPTS: { id: BulkMode; label: string; bg: string }[] = [
  { id: 'got',   label: 'Mark Got',  bg: '#8FE0B5' },
  { id: 'dupe',  label: 'Add Dupe',  bg: '#FFD43A' },
  { id: 'clear', label: 'Clear',     bg: '#FFB7C7' },
]

export function TeamDetailPage() {
  const seedInit = useInitializeSeed()
  const { teamId } = useParams()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<FilterMode>('all')
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkInput, setBulkInput] = useState('')
  const [bulkMode, setBulkMode] = useState<BulkMode>('got')
  const [isBulkApplying, setIsBulkApplying] = useState(false)

  const isTouchDevice = useMemo(
    () => typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0,
    [],
  )
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['team-detail', teamId],
    enabled: seedInit.isSuccess,
    queryFn: async () => {
      const [teams, stickers, entries] = await Promise.all([
        repository.listTeams(),
        repository.listStickers(),
        repository.listEntries(),
      ])
      const team = teams.find((item) => item.id === teamId) ?? null
      const teamStickers = stickers
        .filter((s) => s.teamId === teamId)
        .sort((a, b) => {
          const slotA = Number(a.number.split('-').at(-1))
          const slotB = Number(b.number.split('-').at(-1))
          return slotA - slotB
        })
      return {
        team,
        stickers: teamStickers,
        entriesById: new Map(entries.map((e) => [e.stickerId, e])),
      }
    },
  })

  const mutation = useMutation({
    mutationFn: async ({ stickerId, copies }: { stickerId: string; copies: number }) => {
      return repository.updateSticker(stickerId, fromStickerCopies(copies))
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['team-detail', teamId] }),
        queryClient.invalidateQueries({ queryKey: ['teams-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-view'] }),
      ])
    },
  })

  const isZeroBased = data?.team?.group === 'SPECIAL'

  const stickerSlots = useMemo(() => {
    const zeroBased = data?.team?.group === 'SPECIAL'
    return (data?.stickers ?? []).map((sticker, index) => ({
      sticker,
      slot: zeroBased ? index : index + 1,
      copies: toStickerCopies(data?.entriesById.get(sticker.id)),
    }))
  }, [data])

  const total = stickerSlots.length
  const collected = stickerSlots.filter((s) => s.copies > 0).length
  const missing = total - collected
  const dupeCount = stickerSlots.filter((s) => s.copies >= 2).length
  const progress = total === 0 ? 0 : Math.round((collected / total) * 100)

  const filteredSlots = useMemo(() => {
    return stickerSlots.filter((s) => {
      if (filter === 'missing') return s.copies === 0
      if (filter === 'got')    return s.copies === 1
      if (filter === 'dupes')  return s.copies >= 2
      return true
    })
  }, [stickerSlots, filter])

  const numberToStickerId = useMemo(() => {
    const map = new Map<number, string>()
    for (const item of stickerSlots) map.set(item.slot, item.sticker.id)
    return map
  }, [stickerSlots])

  const bulkMax = isZeroBased ? total - 1 : total
  const bulkMin = isZeroBased ? 0 : 1
  const parsedBulk = useMemo(
    () => parseStickerList(bulkInput, bulkMax, bulkMin),
    [bulkInput, bulkMax, bulkMin],
  )

  const handleStickerClick = async (sticker: Sticker, copies: number) => {
    const nextCopies = copies + 1
    await mutation.mutateAsync({ stickerId: sticker.id, copies: nextCopies })
  }

  const handleLongPress = async (sticker: Sticker) => {
    await mutation.mutateAsync({ stickerId: sticker.id, copies: 0 })
  }

  const startLongPress = (sticker: Sticker) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse') return
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    longPressTimer.current = setTimeout(() => { void handleLongPress(sticker) }, 500)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const applyBulk = async () => {
    if (parsedBulk.length === 0) return
    try {
      setIsBulkApplying(true)
      await Promise.all(
        parsedBulk.map(async (n) => {
          const stickerId = numberToStickerId.get(n)
          if (!stickerId) return
          const currentCopies = toStickerCopies(data?.entriesById.get(stickerId))
          const nextCopies =
            bulkMode === 'got'   ? currentCopies + 1 :
            bulkMode === 'dupe'  ? Math.max(currentCopies, 2) + 1 : 0
          await repository.updateSticker(stickerId, fromStickerCopies(nextCopies))
        }),
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['team-detail', teamId] }),
        queryClient.invalidateQueries({ queryKey: ['teams-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-view'] }),
      ])
      setBulkOpen(false)
    } finally {
      setIsBulkApplying(false)
    }
  }

  if (isLoading) {
    return (
      <AppFrame>
        <div className="sticky-bar"><h1>Loading...</h1></div>
      </AppFrame>
    )
  }

  if (!data?.team) {
    return (
      <AppFrame>
        <div className="sticky-bar">
          <Link className="back-btn" to="/teams">←</Link>
          <h1>Not found</h1>
        </div>
      </AppFrame>
    )
  }

  const { team } = data
  const filterCounts = {
    all:     total,
    missing: missing,
    got:     stickerSlots.filter((s) => s.copies === 1).length,
    dupes:   dupeCount,
  }

  const filterOpts: { id: FilterMode; label: string }[] = [
    { id: 'all',     label: 'All' },
    { id: 'missing', label: 'Missing' },
    { id: 'got',     label: 'Got' },
    { id: 'dupes',   label: 'Doubles' },
  ]

  return (
    <AppFrame>
      {/* Top bar */}
      <div className="sticky-bar">
        <Link className="back-btn" to="/teams">←</Link>
        <h1 className="flex-1">{team.name.toUpperCase()}</h1>
        <span className="nb-tag nb-tag--pink">GRP {team.group}</span>
      </div>

      {/* Hero card */}
      <div style={{ padding: '14px 18px 4px' }}>
        <div className="nb-card nb-card--yellow" style={{ padding: '16px 18px' }}>
          <div className="row items-center gap-3">
            <div className="flag-box" style={{ width: 72, height: 72, borderRadius: 14, boxShadow: '3px 3px 0 #0B0B0F' }}>
              <img src={team.flag} alt={`${team.name} flag`} />
            </div>
            <div className="flex-1">
              <div className="mono uc text-xs text-mute" style={{ marginBottom: 2 }}>{team.id.toUpperCase()}</div>
              <div className="display" style={{ fontSize: 28 }}>
                {collected}
                <span style={{ opacity: 0.4 }}>/{total}</span>
              </div>
              <div className="mono text-xs text-mute">STICKERS</div>
            </div>
            <ProgressRing pct={progress} />
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="filter-strip">
        {filterOpts.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`nb-chip${filter === opt.id ? ' is-active' : ''}`}
            onClick={() => setFilter(opt.id)}
          >
            {opt.label}
            <span className="chip-count">{filterCounts[opt.id]}</span>
          </button>
        ))}
      </div>

      {/* Sticker grid */}
      <div style={{ padding: '12px 18px 4px' }}>
        <div className="sticker-grid">
          {filteredSlots.map(({ sticker, slot, copies }) => {
            const cls =
              copies === 0 ? 'sticker-cell--missing' :
              copies === 1 ? 'sticker-cell--got' :
                             'sticker-cell--dupe'
            return (
              <button
                key={sticker.id}
                type="button"
                className={`sticker-cell ${cls}`}
                aria-label={`Sticker ${String(slot)}`}
                onClick={() => void handleStickerClick(sticker, copies)}
                onPointerDown={startLongPress(sticker)}
                onPointerUp={cancelLongPress}
                onPointerCancel={cancelLongPress}
                onPointerMove={cancelLongPress}
                onContextMenu={(e) => { e.preventDefault(); void handleLongPress(sticker) }}
              >
                <span className="sticker-num">#{String(isZeroBased && slot === 0 ? '00' : slot)}</span>
                {copies >= 2 && (
                  <span className="sticker-dupe-count">x{copies}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ padding: '14px 18px 20px' }}>
        <div className="legend">
          <div className="legend-item">
            <span className="legend-swatch" style={{ background: '#8FE0B5' }} />
            Got it
          </div>
          <div className="legend-item">
            <span className="legend-swatch" style={{ background: '#FFD43A' }} />
            Dupe
          </div>
          <div className="legend-item">
            <span className="legend-swatch" style={{ background: '#F1E6C7' }} />
            Missing
          </div>
          <div className="mono text-xs text-mute" style={{ width: '100%' }}>
            {isTouchDevice
              ? 'Tap → got · tap again → +dupe · hold → clear'
              : 'Tap → got · tap again → +dupe · right-click → clear'
            }
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        type="button"
        className="nb-fab"
        aria-label="Bulk add"
        onClick={() => setBulkOpen(true)}
      >
        +
      </button>

      {/* Bulk add sheet */}
      {bulkOpen && (
        <div
          className="sheet-overlay"
          onClick={() => setBulkOpen(false)}
        >
          <div className="nb-sheet" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
            <div className="sheet-grip" />
            <div className="row between items-center" style={{ marginBottom: 8 }}>
              <div className="display" style={{ fontSize: 22 }}>BULK ADD</div>
              <div className="mono text-xs text-mute">{team.name.toUpperCase()}</div>
            </div>
            <div className="mono text-xs text-mute" style={{ marginBottom: 10 }}>
              ENTER RANGE OR NUMBERS — E.G.{' '}
              <strong>{isZeroBased ? '0-4, 9, 14' : '1-5, 9, 14'}</strong>
            </div>
            <input
              className="nb-input"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={isZeroBased ? '0-4, 9, 14' : '1-5, 9, 14'}
            />

            {/* Mode chips */}
            <div className="row gap-2 wrap" style={{ marginTop: 10 }}>
              {BULK_MODE_OPTS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`nb-chip${bulkMode === m.id ? ' is-active' : ''}`}
                  style={bulkMode !== m.id ? { background: m.bg } : undefined}
                  onClick={() => setBulkMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Preview */}
            <div style={{ marginTop: 14 }}>
              <div className="mono uc text-xs text-mute" style={{ marginBottom: 6 }}>
                PREVIEW · {parsedBulk.length} STICKERS
              </div>
              <div className="row wrap gap-2">
                {parsedBulk.length === 0 && (
                  <div className="mono text-xs text-mute">None selected</div>
                )}
                {parsedBulk.map((n) => (
                  <div
                    key={n}
                    className="mono"
                    style={{
                      width: 34, height: 34,
                      border: '2px solid #0B0B0F',
                      borderRadius: 6,
                      background:
                        bulkMode === 'got'  ? '#8FE0B5' :
                        bulkMode === 'dupe' ? '#FFD43A' :
                                              '#FFB7C7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800,
                    }}
                  >
                    {String(n)}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="row gap-2" style={{ marginTop: 18 }}>
              <button
                type="button"
                className="nb-btn flex-1"
                onClick={() => setBulkOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="nb-btn nb-btn--primary flex-1"
                disabled={isBulkApplying || parsedBulk.length === 0}
                onClick={() => void applyBulk()}
              >
                Apply ({parsedBulk.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </AppFrame>
  )
}
