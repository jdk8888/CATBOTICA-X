/**
 * CATBOTICA Medallions — Read-only eligibility API.
 * GET /api/claim?wallet=0x...
 * Returns: { eligible: { yearId: count }[], claimed: { yearId: number }[], activeYears: number[] }
 * Reads proof JSON + on-chain claimed status. No mint, no private keys, no MINTER_ROLE.
 * CATBOTICA_MEDALLIONS_CURSOR_HANDOFF.md Phase 3.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { getWalletProofsServer } from '@/lib/merkle-proofs-server'
import {
  getMedallionsAddress,
  MEDALLIONS_ABI,
  MEDALLIONS_YEAR_IDS,
} from '@/lib/contracts'

const BASE_CHAIN_ID = 8453

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet')

  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json(
      { error: 'Valid wallet address required (?wallet=0x...)' },
      { status: 400 }
    )
  }

  const medallionsAddress = getMedallionsAddress(BASE_CHAIN_ID)
  if (!medallionsAddress) {
    return NextResponse.json({
      eligible: [],
      claimed: {},
      activeYears: [],
      message: 'Medallions contract not configured.',
    })
  }

  try {
    const [proofs, client] = await Promise.all([
      getWalletProofsServer(wallet),
      Promise.resolve(
        createPublicClient({
          chain: base,
          transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
        })
      ),
    ])

    const eligible: { yearId: number; count: number }[] = []
    const claimed: Record<number, number> = {}

    await Promise.all(
      MEDALLIONS_YEAR_IDS.map(async (yearId) => {
        const proofEntry = proofs[yearId]
        let claimedCount = 0
        try {
          claimedCount = Number(
            await client.readContract({
              address: medallionsAddress,
              abi: MEDALLIONS_ABI,
              functionName: 'claimedCount',
              args: [wallet as `0x${string}`, BigInt(yearId)],
            })
          )
        } catch {
          /* contract not deployed or no such function */
        }
        claimed[yearId] = claimedCount
        if (proofEntry && proofEntry.count > 0) {
          eligible.push({ yearId, count: proofEntry.count })
        }
      })
    )

    const activeYears: number[] = []
    for (const yearId of MEDALLIONS_YEAR_IDS) {
      try {
        const active = await client.readContract({
          address: medallionsAddress,
          abi: MEDALLIONS_ABI,
          functionName: 'isYearActive',
          args: [BigInt(yearId)],
        })
        if (active) activeYears.push(yearId)
      } catch {
        /* skip */
      }
    }

    return NextResponse.json({
      eligible,
      claimed,
      activeYears,
      message: 'Eligibility from Merkle proofs and on-chain claimed status.',
    })
  } catch (error) {
    console.error('[Medallions] GET /api/claim error:', error)
    return NextResponse.json(
      { error: 'Failed to compute eligibility.' },
      { status: 500 }
    )
  }
}
