import { teams2026 } from './teams2026'
import type { SeedBundle, Sticker } from './types'

const TEAM_STICKERS_PER_TEAM = 20

function buildTeamStickers(): Sticker[] {
  return teams2026.flatMap((team) => {
    const isZeroBased = team.group === 'SPECIAL'
    return Array.from({ length: TEAM_STICKERS_PER_TEAM }, (_, idx) => {
      const slot = !isZeroBased ? idx + 1 : idx === 0 ? String(idx).padStart(2, '0') : idx;

      return {
        id: `${team.id}-${slot}`,
        teamId: team.id,
        number: `${team.order}-${slot}`,
        name: `${team.name} Sticker ${slot}`,
        category: 'team' as const,
      }
    })
  })
}

export function buildInitialCollection(): SeedBundle {
  const teams = teams2026.map((team) => ({ ...team }))
  return {
    teams,
    stickers: buildTeamStickers(),
  }
}
