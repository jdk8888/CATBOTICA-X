/**
 * Phase 0 — Verify snapshot blocks for Catbotica Medallions indexer.
 * Run: ETH_RPC_URL=<rpc> npx ts-node scripts/verify-blocks.ts
 * Output: output/verified-blocks.json (and console).
 * CATBOTICA_MEDALLIONS_CURSOR_HANDOFF.md Phase 0.
 */

import { ethers } from 'ethers'
import * as fs from 'fs'
import * as path from 'path'

const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL)

const targets = [
  { year: 1, zodiac: 'Tiger', date: '2022-02-01', ts: 1643673600 },
  { year: 2, zodiac: 'Rabbit', date: '2023-01-22', ts: 1674345600 },
  { year: 3, zodiac: 'Dragon', date: '2024-02-10', ts: 1707523200 },
  { year: 4, zodiac: 'Snake', date: '2025-01-29', ts: 1738108800 },
]

async function findBlockAtTimestamp(targetTs: number): Promise<number> {
  let lo = 14_000_000
  const hi = await provider.getBlockNumber()
  let high = hi
  while (lo < high) {
    const mid = Math.floor((lo + high) / 2)
    const block = await provider.getBlock(mid)
    if (!block) break
    if (block.timestamp < targetTs) lo = mid + 1
    else high = mid
  }
  return lo
}

async function main() {
  if (!process.env.ETH_RPC_URL) {
    console.error('Set ETH_RPC_URL (Ethereum mainnet RPC).')
    process.exit(1)
  }

  const outDir = path.join(process.cwd(), 'output')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const results: Array<{
    year: number
    zodiac: string
    date: string
    block: number
    timestamp: string
  }> = []

  for (const t of targets) {
    const block = await findBlockAtTimestamp(t.ts)
    const confirmed = await provider.getBlock(block)
    const timestamp = confirmed?.timestamp ?? 0
    const timestampIso = new Date(timestamp * 1000).toISOString()
    console.log(
      `Year ${t.year} (${t.zodiac}) | ${t.date} | Block: ${block} | Actual timestamp: ${timestampIso}`
    )
    results.push({
      year: t.year,
      zodiac: t.zodiac,
      date: t.date,
      block,
      timestamp: timestampIso,
    })
  }

  const outPath = path.join(outDir, 'verified-blocks.json')
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`\nWrote ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
