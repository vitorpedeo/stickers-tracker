import type { CollectionEntry, Sticker, Team } from './types'

export type MissingByTeam = {
  team: Team
  missingNumbers: string[]
}

function stickerDisplayNumber(sticker: Sticker): string {
  const separatorIndex = sticker.number.lastIndexOf('-')
  return separatorIndex === -1 ? sticker.number : sticker.number.slice(separatorIndex + 1)
}

function compareStickerNumbers(left: Sticker, right: Sticker): number {
  const leftNumber = stickerDisplayNumber(left)
  const rightNumber = stickerDisplayNumber(right)
  const leftNumeric = Number(leftNumber)
  const rightNumeric = Number(rightNumber)

  if (Number.isFinite(leftNumeric) && Number.isFinite(rightNumeric) && leftNumeric !== rightNumeric) {
    return leftNumeric - rightNumeric
  }

  return leftNumber.localeCompare(rightNumber, undefined, { numeric: true })
}

export function buildMissingByTeam(
  teams: Team[],
  stickers: Sticker[],
  entries: CollectionEntry[],
  teamId?: string,
): MissingByTeam[] {
  const collectedIds = new Set(
    entries.filter((e) => e.status === 'collected').map((e) => e.stickerId),
  )

  const filteredTeams = teamId ? teams.filter((t) => t.id === teamId) : teams

  return filteredTeams
    .map((team) => {
      const missingNumbers = stickers
        .filter((s) => s.teamId !== null && s.teamId === team.id && !collectedIds.has(s.id))
        .sort(compareStickerNumbers)
        .map(stickerDisplayNumber)
      return { team, missingNumbers }
    })
    .filter((item) => item.missingNumbers.length > 0)
    .sort((left, right) => {
      if (left.team.group !== right.team.group) {
        return left.team.group.localeCompare(right.team.group)
      }
      if (left.team.order !== right.team.order) {
        return left.team.order - right.team.order
      }
      return left.team.name.localeCompare(right.team.name)
    })
}
