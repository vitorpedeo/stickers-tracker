import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppFrame } from '../components/AppFrame'
import { repository } from '../data/repositorySingleton'
import { fromStickerCopies, toStickerCopies } from '../domain/progress'
import type { Sticker } from '../domain/types'
import { useInitializeSeed } from '../features/stickers/hooks'

function parseStickerList(input: string, maxSticker: number) {
  const selected = new Set<number>()

  for (const token of input.split(',')) {
    const trimmed = token.trim()

    if (!trimmed) {
      continue
    }

    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/)
    if (rangeMatch) {
      const start = Number(rangeMatch[1])
      const end = Number(rangeMatch[2])
      const min = Math.min(start, end)
      const max = Math.max(start, end)

      for (let value = min; value <= max; value += 1) {
        if (value >= 1 && value <= maxSticker) {
          selected.add(value)
        }
      }
      continue
    }

    const single = Number(trimmed)
    if (Number.isInteger(single) && single >= 1 && single <= maxSticker) {
      selected.add(single)
    }
  }

  return Array.from(selected).sort((left, right) => left - right)
}

function formatSlot(slot: number) {
  return slot.toString().padStart(2, '0')
}

export function TeamDetailPage() {
  const seedInit = useInitializeSeed()
  const { teamId } = useParams()
  const queryClient = useQueryClient()
  const [bulkInput, setBulkInput] = useState('')
  const [selectedStickerIds, setSelectedStickerIds] = useState<Set<string>>(new Set())
  const [isBulkApplying, setIsBulkApplying] = useState(false)

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
        .filter((sticker) => sticker.teamId === teamId)
        .sort((left, right) => left.number.localeCompare(right.number))

      return {
        team,
        stickers: teamStickers,
        entriesById: new Map(entries.map((entry) => [entry.stickerId, entry])),
      }
    },
  })

  const mutation = useMutation({
    mutationFn: async ({ stickerId, copies }: { stickerId: string; copies: number }) => {
      const patch = fromStickerCopies(copies)
      return repository.updateSticker(stickerId, patch)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['team-detail', teamId] }),
        queryClient.invalidateQueries({ queryKey: ['teams-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-view'] }),
      ])
    },
  })

  const stickerSlots = useMemo(() => {
    const stickers = data?.stickers ?? []
    return stickers.map((sticker, index) => ({
      sticker,
      slot: index + 1,
    }))
  }, [data?.stickers])

  const total = stickerSlots.length
  const collected = stickerSlots.reduce((acc, item) => {
    return acc + (toStickerCopies(data?.entriesById.get(item.sticker.id)) > 0 ? 1 : 0)
  }, 0)
  const missing = total - collected
  const duplicateCopies = stickerSlots.reduce((acc, item) => {
    const copies = toStickerCopies(data?.entriesById.get(item.sticker.id))
    return acc + Math.max(0, copies - 1)
  }, 0)

  const numberToStickerId = useMemo(() => {
    const map = new Map<number, string>()

    for (const item of stickerSlots) {
      map.set(item.slot, item.sticker.id)
    }

    return map
  }, [stickerSlots])

  const applyBulkAction = async (action: 'collected' | 'duplicate' | 'clear') => {
    const selectedIds = Array.from(selectedStickerIds)
    const parsedNumbers = parseStickerList(bulkInput, total)
    const parsedIds = parsedNumbers
      .map((number) => numberToStickerId.get(number))
      .filter((value): value is string => Boolean(value))

    const targets = selectedIds.length > 0 ? selectedIds : parsedIds

    if (targets.length === 0) {
      return
    }

    try {
      setIsBulkApplying(true)
      await Promise.all(
        targets.map(async (stickerId) => {
          const currentCopies = toStickerCopies(data?.entriesById.get(stickerId))
          const nextCopies =
            action === 'collected'
              ? Math.max(currentCopies, 1)
              : action === 'duplicate'
                ? Math.max(currentCopies, 2)
                : 0

          const patch = fromStickerCopies(nextCopies)
          await repository.updateSticker(stickerId, patch)
        }),
      )

      setSelectedStickerIds(new Set())

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['team-detail', teamId] }),
        queryClient.invalidateQueries({ queryKey: ['teams-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-view'] }),
      ])
    } finally {
      setIsBulkApplying(false)
    }
  }

  const runSelectList = () => {
    const parsedNumbers = parseStickerList(bulkInput, total)
    const next = new Set<string>()

    for (const number of parsedNumbers) {
      const stickerId = numberToStickerId.get(number)
      if (stickerId) {
        next.add(stickerId)
      }
    }

    setSelectedStickerIds(next)
  }

  const toggleSelection = (stickerId: string) => {
    setSelectedStickerIds((previous) => {
      const next = new Set(previous)
      if (next.has(stickerId)) {
        next.delete(stickerId)
      } else {
        next.add(stickerId)
      }
      return next
    })
  }

  const handleStickerClick = async (sticker: Sticker) => {
    if (selectedStickerIds.size > 0) {
      toggleSelection(sticker.id)
      return
    }

    const currentCopies = toStickerCopies(data?.entriesById.get(sticker.id))
    const nextCopies = currentCopies === 0 ? 1 : currentCopies === 1 ? 2 : 0
    await mutation.mutateAsync({ stickerId: sticker.id, copies: nextCopies })
  }

  return (
    <AppFrame>
      {isLoading ? <p className="meta-line">Loading team details...</p> : null}

      {!isLoading && !data?.team ? (
        <p className="panel empty-state">Team not found. Check your team link and try again.</p>
      ) : null}

      {data?.team ? (
        <>
          <section className="page-head team-head">
            <div>
              <Link className="chip back-chip" to="/teams">
                ← Back to Teams
              </Link>
              <div className="team-hero">
                <img
                  className="team-hero-flag"
                  src={data.team.flag}
                  alt={`${data.team.name} flag`}
                />
                <div>
                  <h1 className="page-title">{data.team.name}</h1>
                  <p className="page-subtitle">
                    Group {data.team.group} · {total} stickers
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="panel bulk-panel">
            <p className="meta-tip">
              Bulk update format: <code>1-5, 9, 14</code>
            </p>
            <div className="bulk-controls">
              <input
                className="field-input"
                aria-label="Bulk sticker list"
                placeholder="1-5, 9, 14"
                value={bulkInput}
                onChange={(event) => setBulkInput(event.target.value)}
              />
              <button type="button" className="btn" onClick={runSelectList}>
                Select list
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => applyBulkAction('collected')}
                disabled={isBulkApplying}
              >
                Mark collected
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => applyBulkAction('duplicate')}
                disabled={isBulkApplying}
              >
                Mark duplicate
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => applyBulkAction('clear')}
                disabled={isBulkApplying}
              >
                Clear
              </button>
            </div>
          </section>

          <section className="panel sticker-panel">
            <p className="stats-pill">
              {collected}/{total} collected · {missing} missing · {duplicateCopies} dupes
            </p>

            <div className="sticker-grid">
              {stickerSlots.map(({ sticker, slot }) => {
                const copies = toStickerCopies(data.entriesById.get(sticker.id))
                const isSelected = selectedStickerIds.has(sticker.id)
                const stateClass =
                  copies === 0
                    ? 'is-missing'
                    : copies === 1
                      ? 'is-collected'
                      : 'is-duplicate'

                const stateLabel =
                  copies === 0 ? 'Missing' : copies === 1 ? 'Collected' : `Dupes x${copies}`

                return (
                  <button
                    key={sticker.id}
                    type="button"
                    className={`sticker-cell ${stateClass} ${isSelected ? 'is-selected' : ''}`}
                    aria-label={`Sticker ${formatSlot(slot)}`}
                    onClick={() => {
                      void handleStickerClick(sticker)
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      toggleSelection(sticker.id)
                    }}
                  >
                    <span className="sticker-number">#{formatSlot(slot)}</span>
                    <span className="sticker-state">{stateLabel}</span>
                  </button>
                )
              })}
            </div>
          </section>
        </>
      ) : null}
    </AppFrame>
  )
}
