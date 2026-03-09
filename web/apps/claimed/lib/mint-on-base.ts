/**
 * CATBOTICA — Server-side mint on Base (chainId 8453).
 * Only import this in server code (e.g. API route). Never expose CLAIM_SERVICE_PRIVATE_KEY.
 * Lore Anchor: CAT-EVENT-LMRP-2026-HORSE
 */

import { createWalletClient, createPublicClient, http, type Address } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { getContractAddresses, areContractsDeployed } from './contracts'
import { ZODIAC_BADGES_ABI, SOULBOUND_ABI, CURRENT_BADGE_TOKEN_ID } from './contracts'

const CHAIN_ID = 8453

export interface MintResult {
  success: boolean
  txHashBadge?: `0x${string}`
  txHashSbt?: `0x${string}`
  error?: string
}

/**
 * Returns true if mint can run (env and contracts configured).
 */
export function isMintConfigured(): boolean {
  if (!process.env.CLAIM_SERVICE_PRIVATE_KEY?.startsWith('0x')) return false
  if (!process.env.BASE_RPC_URL) return false
  return areContractsDeployed(CHAIN_ID)
}

/**
 * Simulate then send ERC-1155 mintBadge + SBT issueProof on Base.
 * Call only from server (e.g. POST /api/claim).
 */
export async function mintAirdropToHolder(
  to: Address,
  claimId: string,
  tokenId: number = CURRENT_BADGE_TOKEN_ID
): Promise<MintResult> {
  const key = process.env.CLAIM_SERVICE_PRIVATE_KEY
  const rpcUrl = process.env.BASE_RPC_URL
  const addresses = getContractAddresses(CHAIN_ID)

  if (!key?.startsWith('0x') || !rpcUrl || !addresses || addresses.erc1155 === '0x0000000000000000000000000000000000000000') {
    return { success: false, error: 'Mint not configured (missing CLAIM_SERVICE_PRIVATE_KEY, BASE_RPC_URL, or contract addresses).' }
  }

  const account = privateKeyToAccount(key as `0x${string}`)
  const transport = http(rpcUrl)
  const publicClient = createPublicClient({ chain: base, transport })
  const walletClient = createWalletClient({ account, chain: base, transport })

  if (!walletClient) return { success: false, error: 'Wallet client failed' }

  try {
    // 1. Simulate ERC-1155 mintBadge
    await publicClient.simulateContract({
      address: addresses.erc1155,
      abi: ZODIAC_BADGES_ABI,
      functionName: 'mintBadge',
      args: [to, BigInt(tokenId), claimId],
      account,
    })

    // 2. Simulate SBT issueProof
    await publicClient.simulateContract({
      address: addresses.sbt,
      abi: SOULBOUND_ABI,
      functionName: 'issueProof',
      args: [to, BigInt(tokenId), claimId],
      account,
    })

    // 3. Send ERC-1155 mint tx
    const hashBadge = await walletClient.writeContract({
      address: addresses.erc1155,
      abi: ZODIAC_BADGES_ABI,
      functionName: 'mintBadge',
      args: [to, BigInt(tokenId), claimId],
      account,
    })

    // 4. Wait for badge tx (optional but ensures order)
    await publicClient.waitForTransactionReceipt({ hash: hashBadge })

    // 5. Send SBT issue tx
    const hashSbt = await walletClient.writeContract({
      address: addresses.sbt,
      abi: SOULBOUND_ABI,
      functionName: 'issueProof',
      args: [to, BigInt(tokenId), claimId],
      account,
    })

    return {
      success: true,
      txHashBadge: hashBadge,
      txHashSbt: hashSbt,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[mint-on-base]', message)
    return { success: false, error: message }
  }
}
