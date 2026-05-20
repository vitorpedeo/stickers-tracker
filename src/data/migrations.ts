export const CURRENT_SEED_VERSION = '2026.3'

export function shouldReseed(storedSeedVersion: string | undefined): boolean {
  return storedSeedVersion !== CURRENT_SEED_VERSION
}
