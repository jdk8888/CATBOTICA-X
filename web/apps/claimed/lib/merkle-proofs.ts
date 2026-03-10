/**
 * Catbotica Medallions — Merkle proof loading and wallet eligibility.
 * Client: fetch /proofs/. Server: read from public/proofs/.
 * CATBOTICA_MEDALLIONS_CURSOR_HANDOFF.md Phase 3.
 */

const ZODIAC_NAMES: Record<number, string> = {
  1: 'tiger',
  2: 'rabbit',
  3: 'dragon',
  4: 'snake',
  5: 'horse',
}

export type YearProof = { count: number; proof: string[] }
export type WalletProofs = Record<number, YearProof> // yearId → proof

const YEARS = [1, 2, 3, 4, 5] as const

/**
 * Load proof files and look up wallet eligibility (client-side).
 * Fetches /proofs/proofs-{yearId}-{zodiac}.json; each file is { [walletLower]: { count, proof } }.
 */
export async function getWalletProofs(wallet: string): Promise<WalletProofs> {
  const normalized = wallet.toLowerCase()
  const result: WalletProofs = {}

  await Promise.all(
    YEARS.map(async (yearId) => {
      try {
        const slug = ZODIAC_NAMES[yearId]
        const res = await fetch(`/proofs/proofs-${yearId}-${slug}.json`)
        if (!res.ok) return
        const data = (await res.json()) as Record<string, { count: number; proof: string[] }>
        const entry = data[normalized]
        if (entry && Array.isArray(entry.proof) && typeof entry.count === 'number') {
          result[yearId] = { count: entry.count, proof: entry.proof }
        }
      } catch {
        /* year not yet active or missing file */
      }
    })
  )

  return result
}

