import { teams2026 } from './teams2026'
import type { SeedBundle, Sticker } from './types'

const TEAM_STICKERS_PER_TEAM = 20
const SPECIAL_STICKER_COUNT = 20

function buildTeamStickers(): Sticker[] {
  return teams2026.flatMap((team) =>
    Array.from({ length: TEAM_STICKERS_PER_TEAM }, (_, idx) => {
      const slot = idx + 1
      const paddedSlot = slot.toString().padStart(2, '0')
      const paddedTeamOrder = team.order.toString().padStart(2, '0')

      return {
        id: `${team.id}-${paddedSlot}`,
        teamId: team.id,
        number: `${paddedTeamOrder}-${paddedSlot}`,
        name: `${team.name} Sticker ${slot}`,
        category: 'team',
      }
    }),
  )
}

function buildSpecialStickers(): Sticker[] {
  return Array.from({ length: SPECIAL_STICKER_COUNT }, (_, idx) => {
    const slot = idx + 1
    const paddedSlot = slot.toString().padStart(2, '0')

    return {
      id: `special-${paddedSlot}`,
      teamId: null,
      number: `S-${paddedSlot}`,
      name: `Special Sticker ${slot}`,
      category: 'special',
    }
  })
}

export function buildInitialCollection(): SeedBundle {
  const teamStickers = buildTeamStickers()
  const specialStickers = buildSpecialStickers()
  const teams = teams2026.map((team) => ({ ...team }))

  return {
    teams,
    stickers: [...teamStickers, ...specialStickers],
  }
}
