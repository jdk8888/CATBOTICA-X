/**
 * Server-only: load proof files from filesystem (for API route).
 * Do not import from client code.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import type { WalletProofs } from './merkle-proofs'

const ZODIAC_NAMES: Record<number, string> = {
  1: 'tiger',
  2: 'rabbit',
  3: 'dragon',
  4: 'snake',
  5: 'horse',
}

const YEARS = [1, 2, 3, 4, 5] as const

export async function getWalletProofsServer(
  wallet: string,
  basePath?: string
): Promise<WalletProofs> {
  const normalized = wallet.toLowerCase()
  const result: WalletProofs = {}
  const root = basePath ?? path.join(process.cwd(), 'public', 'proofs')

  await Promise.all(
    YEARS.map(async (yearId) => {
      try {
        const slug = ZODIAC_NAMES[yearId]
        const filePath = path.join(root, `proofs-${yearId}-${slug}.json`)
        const raw = await fs.readFile(filePath, 'utf-8')
        const data = JSON.parse(raw) as Record<string, { count: number; proof: string[] }>
        const entry = data[normalized]
        if (entry && Array.isArray(entry.proof) && typeof entry.count === 'number') {
          result[yearId] = { count: entry.count, proof: entry.proof }
        }
      } catch {
        /* file missing or invalid */
      }
    })
  )

  return result
}
