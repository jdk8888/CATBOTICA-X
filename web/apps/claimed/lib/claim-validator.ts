/**
 * ═══════════════════════════════════════════════════════════════
 *  CATBOTICA LUNAR BADGE — CLAIM VALIDATION SCRIPT
 *  Lore Anchor: LS-CATBOTICA-ANCHOR-012 / CAT-EVENT-LMRP-2026-HORSE
 * ═══════════════════════════════════════════════════════════════
 *
 *  The core validation logic that determines badge eligibility.
 *  Three gates, executed in sequence:
 *
 *  GATE 1: WHO ARE THEY?
 *    → Wallet address verification (signature proves ownership)
 *    → Social identity binding (Discord ID or Kakao ID)
 *
 *  GATE 2: WHAT DO THEY HAVE?
 *    → On-chain NFT check: Does this wallet hold a Catbotica NFT?
 *    → Balance check via ERC-721 balanceOf or ERC-1155 balanceOf
 *
 *  GATE 3: ARE THEY ALLOWED?
 *    → Has this wallet already claimed this cycle's badge?
 *    → Is the badge currently active (LMRP window open)?
 *    → Has this social ID already been used for a claim?
 *
 *  If all three gates pass → ELIGIBLE. Proceed to mint.
 *  If any gate fails → REJECTED. Return specific failure reason.
 * ═══════════════════════════════════════════════════════════════
 */

import { createPublicClient, http, type Address } from 'viem'
import { base, mainnet } from 'viem/chains'
import {
  ZODIAC_BADGES_ABI,
  SOULBOUND_ABI,
  CURRENT_BADGE_TOKEN_ID,
  getContractAddresses,
  areContractsDeployed,
} from './contracts'

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

/** Social platform identifier — Discord or Kakao (KakaoTalk). */
export type SocialPlatform = 'discord' | 'kakao'

/** Social identity binding for claim eligibility. */
export interface SocialIdentity {
  platform: SocialPlatform
  /** Discord username (e.g., "catbotica_holder#1234") or Kakao ID. */
  userId: string
}

/** Input for the full validation pipeline. */
export interface ClaimValidationInput {
  walletAddress: Address
  socialIdentity: SocialIdentity
  /** Which badge they're claiming (defaults to CURRENT_BADGE_TOKEN_ID). */
  badgeTokenId?: number
  /** Chain to verify on (defaults to 8453 = Base). */
  chainId?: number
}

/** Result of a single validation gate. */
export interface GateResult {
  passed: boolean
  code: string
  message: string
  /** Additional context for debugging/display. */
  details?: Record<string, unknown>
}

/** Full validation result with all three gates. */
export interface ClaimValidationResult {
  eligible: boolean
  gate1_identity: GateResult
  gate2_holdings: GateResult
  gate3_claimStatus: GateResult
  /** Summary message for the user. */
  summary: string
  /** Timestamp of validation. */
  validatedAt: string
}

// ═══════════════════════════════════════════════════════════════
//  CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Catbotica NFT contract address (the original collection).
 * This is what users must HOLD to be eligible for the zodiac badge.
 * Update with the actual deployed contract address.
 */
const CATBOTICA_NFT_CONTRACT: Address =
  (process.env.CATBOTICA_NFT_CONTRACT_ADDRESS as Address) ||
  '0x0000000000000000000000000000000000000000'

/**
 * Chain ID where the original Catbotica NFT lives.
 * Default: Ethereum mainnet (1). Override via env.
 */
const CATBOTICA_NFT_CHAIN_ID = parseInt(
  process.env.CATBOTICA_NFT_CHAIN_ID || '1'
)

/**
 * Whether to enforce NFT ownership check.
 * Set to false for open claims (e.g., community events, airdrops).
 */
const ENFORCE_NFT_GATE = process.env.ENFORCE_NFT_GATE !== 'false'

/**
 * Whether to enforce social identity binding.
 * If true, a Discord or Kakao ID is required to claim.
 */
const ENFORCE_SOCIAL_GATE = process.env.ENFORCE_SOCIAL_GATE !== 'false'

// ═══════════════════════════════════════════════════════════════
//  SOCIAL IDENTITY STORE (MVP — In-Memory)
//  TODO: Replace with Supabase/PostgreSQL for production
// ═══════════════════════════════════════════════════════════════

/**
 * Maps social IDs to wallet addresses to prevent:
 * - One Discord/Kakao account claiming with multiple wallets
 * - Duplicate social identity abuse
 *
 * Key: "discord:username#1234" or "kakao:userid"
 * Value: wallet address that already used this social ID
 */
const socialClaimStore = new Map<string, string>()

/** Build a unique key for the social identity store. */
function socialKey(identity: SocialIdentity): string {
  return `${identity.platform}:${identity.userId.toLowerCase().trim()}`
}

// ═══════════════════════════════════════════════════════════════
//  VALIDATION PATTERNS
// ═══════════════════════════════════════════════════════════════

/** Validate Discord username format (username or username#XXXX). */
export function isValidDiscordId(id: string): boolean {
  // New Discord usernames (2023+): 2-32 chars, lowercase, alphanumeric + dots + underscores
  const newFormat = /^[a-z0-9._]{2,32}$/
  // Legacy format: username#0000-9999
  const legacyFormat = /^.{2,32}#\d{4}$/
  return newFormat.test(id) || legacyFormat.test(id)
}

/** Validate Kakao ID format. */
export function isValidKakaoId(id: string): boolean {
  // Kakao IDs: 2-20 characters, alphanumeric + underscores
  return /^[a-zA-Z0-9_]{2,20}$/.test(id)
}

/** Validate social identity based on platform. */
export function isValidSocialIdentity(identity: SocialIdentity): boolean {
  if (identity.platform === 'discord') {
    return isValidDiscordId(identity.userId)
  }
  if (identity.platform === 'kakao') {
    return isValidKakaoId(identity.userId)
  }
  return false
}

// ═══════════════════════════════════════════════════════════════
//  ERC-721 ABI (for checking original Catbotica NFT holdings)
// ═══════════════════════════════════════════════════════════════

const ERC721_BALANCE_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ═══════════════════════════════════════════════════════════════
//  GATE 1: WHO ARE THEY? (Identity Verification)
// ═══════════════════════════════════════════════════════════════

/**
 * Gate 1 verifies:
 *  1. Wallet address is valid (format check)
 *  2. Social identity is provided and valid format
 *  3. Social identity has not already been used for a claim
 *
 * Note: Wallet SIGNATURE verification happens separately in the
 * claim API route (route.ts) via viem's verifyMessage().
 * This gate handles the identity BINDING, not the cryptographic proof.
 */
async function validateGate1_Identity(
  walletAddress: Address,
  socialIdentity: SocialIdentity
): Promise<GateResult> {
  // 1. Wallet format check
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return {
      passed: false,
      code: 'INVALID_WALLET_FORMAT',
      message: 'Unit ID (wallet address) format is invalid.',
    }
  }

  // 2. Social identity format check
  if (!ENFORCE_SOCIAL_GATE) {
    return {
      passed: true,
      code: 'SOCIAL_GATE_DISABLED',
      message: 'Social identity gate disabled — open claim mode.',
      details: { socialGateEnforced: false },
    }
  }

  if (!socialIdentity || !socialIdentity.userId) {
    return {
      passed: false,
      code: 'MISSING_SOCIAL_ID',
      message: 'A Discord or Kakao ID is required to verify your identity.',
    }
  }

  if (!isValidSocialIdentity(socialIdentity)) {
    const platformName = socialIdentity.platform === 'discord' ? 'Discord' : 'KakaoTalk'
    return {
      passed: false,
      code: 'INVALID_SOCIAL_FORMAT',
      message: `Invalid ${platformName} ID format. Please check and retry.`,
      details: {
        platform: socialIdentity.platform,
        providedId: socialIdentity.userId,
      },
    }
  }

  // 3. Check if social ID already used
  const key = socialKey(socialIdentity)
  const existingWallet = socialClaimStore.get(key)
  if (existingWallet && existingWallet !== walletAddress.toLowerCase()) {
    return {
      passed: false,
      code: 'SOCIAL_ID_ALREADY_USED',
      message: `This ${socialIdentity.platform === 'discord' ? 'Discord' : 'KakaoTalk'} account has already been used for a claim with a different wallet.`,
      details: {
        platform: socialIdentity.platform,
        conflictDetected: true,
      },
    }
  }

  return {
    passed: true,
    code: 'IDENTITY_VERIFIED',
    message: 'Identity verification passed.',
    details: {
      platform: socialIdentity.platform,
      socialIdBound: true,
    },
  }
}

// ═══════════════════════════════════════════════════════════════
//  GATE 2: WHAT DO THEY HAVE? (NFT Holdings Check)
// ═══════════════════════════════════════════════════════════════

/**
 * Gate 2 verifies:
 *  1. Does this wallet hold at least one Catbotica NFT?
 *     (Checks the ORIGINAL collection contract — ERC-721)
 *  2. If on-chain badge contracts are deployed, also checks
 *     if they already hold the specific zodiac badge (ERC-1155).
 */
async function validateGate2_Holdings(
  walletAddress: Address,
  badgeTokenId: number,
  chainId: number
): Promise<GateResult> {
  // If NFT gate is disabled (open claim / airdrop mode)
  if (!ENFORCE_NFT_GATE) {
    return {
      passed: true,
      code: 'NFT_GATE_DISABLED',
      message: 'NFT ownership gate disabled — open claim mode.',
      details: { nftGateEnforced: false },
    }
  }

  // Check if NFT contract is configured
  const zeroAddr = '0x0000000000000000000000000000000000000000'
  if (CATBOTICA_NFT_CONTRACT === zeroAddr) {
    return {
      passed: true,
      code: 'NFT_CONTRACT_NOT_CONFIGURED',
      message: 'NFT contract address not configured — skipping ownership check.',
      details: { nftContractConfigured: false },
    }
  }

  try {
    // Create client for the chain where the original NFT lives
    const chainConfig = CATBOTICA_NFT_CHAIN_ID === 1 ? mainnet : base
    const client = createPublicClient({
      chain: chainConfig,
      transport: http(),
    })

    // Check ERC-721 balance of original Catbotica NFT
    const balance = await client.readContract({
      address: CATBOTICA_NFT_CONTRACT,
      abi: ERC721_BALANCE_ABI,
      functionName: 'balanceOf',
      args: [walletAddress],
    })

    if (balance === 0n) {
      return {
        passed: false,
        code: 'NO_CATBOTICA_NFT',
        message:
          'No Catbotica NFT detected in this wallet. You must hold at least one Catbotica unit to claim a zodiac badge.',
        details: {
          contractChecked: CATBOTICA_NFT_CONTRACT,
          chainId: CATBOTICA_NFT_CHAIN_ID,
          balance: 0,
        },
      }
    }

    return {
      passed: true,
      code: 'NFT_HOLDER_VERIFIED',
      message: `Catbotica NFT holder confirmed. ${balance.toString()} unit(s) detected.`,
      details: {
        contractChecked: CATBOTICA_NFT_CONTRACT,
        chainId: CATBOTICA_NFT_CHAIN_ID,
        balance: Number(balance),
      },
    }
  } catch (error) {
    // If chain call fails, we don't block the claim but flag it
    console.error('[LMRP Validator] Gate 2 RPC error:', error)
    return {
      passed: true,
      code: 'NFT_CHECK_RPC_ERROR',
      message:
        'Unable to verify NFT holdings (RPC error). Proceeding with caution — manual review required.',
      details: {
        error: error instanceof Error ? error.message : 'Unknown RPC error',
        manualReviewRequired: true,
      },
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  GATE 3: ARE THEY ALLOWED? (Claim Status)
// ═══════════════════════════════════════════════════════════════

/**
 * Gate 3 verifies:
 *  1. Is the requested badge currently active (LMRP window open)?
 *  2. Has this wallet already claimed this specific badge?
 *  3. Has this wallet already received the SBT proof?
 *
 * Checks BOTH the on-chain state (if contracts deployed) and
 * the off-chain claims store (for MVP/pre-deployment).
 */
async function validateGate3_ClaimStatus(
  walletAddress: Address,
  badgeTokenId: number,
  chainId: number,
  offchainClaimsStore: Map<string, unknown>
): Promise<GateResult> {
  // ── Off-chain check (MVP claims store) ──
  const existingOffchainClaim = offchainClaimsStore.get(
    walletAddress.toLowerCase()
  )
  if (existingOffchainClaim) {
    return {
      passed: false,
      code: 'ALREADY_CLAIMED_OFFCHAIN',
      message:
        'This unit has already completed Luck-Module Recalibration for this cycle.',
      details: {
        source: 'offchain_store',
        existingClaim: true,
      },
    }
  }

  // ── On-chain check (if contracts are deployed) ──
  if (areContractsDeployed(chainId)) {
    try {
      const addresses = getContractAddresses(chainId)!
      const client = createPublicClient({
        chain: chainId === 8453 ? base : mainnet,
        transport: http(),
      })

      // Check if badge is active
      const badgeActive = await client.readContract({
        address: addresses.erc1155,
        abi: ZODIAC_BADGES_ABI,
        functionName: 'badgeActive',
        args: [BigInt(badgeTokenId)],
      })

      if (!badgeActive) {
        return {
          passed: false,
          code: 'BADGE_NOT_ACTIVE',
          message:
            'This zodiac badge is not currently active for claiming. The LMRP window may be closed.',
          details: {
            badgeTokenId,
            active: false,
          },
        }
      }

      // Check if already claimed on-chain
      const hasClaimed = await client.readContract({
        address: addresses.erc1155,
        abi: ZODIAC_BADGES_ABI,
        functionName: 'hasClaimed',
        args: [walletAddress, BigInt(badgeTokenId)],
      })

      if (hasClaimed) {
        return {
          passed: false,
          code: 'ALREADY_CLAIMED_ONCHAIN',
          message:
            'This wallet has already claimed this zodiac badge on-chain.',
          details: {
            source: 'onchain_erc1155',
            badgeTokenId,
            hasClaimed: true,
          },
        }
      }

      // Check if SBT proof already issued
      const hasProof = await client.readContract({
        address: addresses.sbt,
        abi: SOULBOUND_ABI,
        functionName: 'hasCompletedRecalibration',
        args: [walletAddress, BigInt(badgeTokenId)],
      })

      if (hasProof) {
        return {
          passed: false,
          code: 'SBT_ALREADY_ISSUED',
          message:
            'A soulbound recalibration proof has already been issued to this wallet for this cycle.',
          details: {
            source: 'onchain_sbt',
            badgeTokenId,
            sbtIssued: true,
          },
        }
      }
    } catch (error) {
      console.error('[LMRP Validator] Gate 3 on-chain check error:', error)
      // Continue — off-chain check already passed
    }
  }

  return {
    passed: true,
    code: 'CLAIM_ELIGIBLE',
    message: 'No existing claim found. Unit is eligible for recalibration.',
    details: {
      badgeTokenId,
      offchainChecked: true,
      onchainChecked: areContractsDeployed(chainId),
    },
  }
}

// ═══════════════════════════════════════════════════════════════
//  MAIN VALIDATION PIPELINE
// ═══════════════════════════════════════════════════════════════

/**
 * Run the full three-gate validation pipeline.
 *
 * @param input        - Wallet, social identity, badge ID, chain
 * @param claimsStore  - The off-chain claims store (from route.ts)
 * @returns Full validation result with per-gate details
 *
 * @example
 * ```ts
 * const result = await validateClaim({
 *   walletAddress: '0x1234...',
 *   socialIdentity: { platform: 'discord', userId: 'catfan.eth' },
 *   badgeTokenId: 5, // Horse (2026)
 * }, claimsStore)
 *
 * if (result.eligible) {
 *   // Proceed to mint
 * } else {
 *   // Return first failing gate's message
 * }
 * ```
 */
export async function validateClaim(
  input: ClaimValidationInput,
  claimsStore: Map<string, unknown>
): Promise<ClaimValidationResult> {
  const {
    walletAddress,
    socialIdentity,
    badgeTokenId = CURRENT_BADGE_TOKEN_ID,
    chainId = 8453, // Base
  } = input

  // ── GATE 1: Identity ──
  const gate1 = await validateGate1_Identity(walletAddress, socialIdentity)

  // ── GATE 2: Holdings (only if Gate 1 passed) ──
  const gate2 = gate1.passed
    ? await validateGate2_Holdings(walletAddress, badgeTokenId, chainId)
    : { passed: false, code: 'SKIPPED', message: 'Skipped — Gate 1 failed.' }

  // ── GATE 3: Claim Status (only if Gate 1 + 2 passed) ──
  const gate3 =
    gate1.passed && gate2.passed
      ? await validateGate3_ClaimStatus(
          walletAddress,
          badgeTokenId,
          chainId,
          claimsStore
        )
      : {
          passed: false,
          code: 'SKIPPED',
          message: 'Skipped — previous gate failed.',
        }

  const eligible = gate1.passed && gate2.passed && gate3.passed

  // Build summary
  let summary: string
  if (eligible) {
    summary =
      'All gates passed. Unit is cleared for Luck-Module Recalibration.'
  } else if (!gate1.passed) {
    summary = `Identity verification failed: ${gate1.message}`
  } else if (!gate2.passed) {
    summary = `Holdings check failed: ${gate2.message}`
  } else {
    summary = `Claim status check failed: ${gate3.message}`
  }

  return {
    eligible,
    gate1_identity: gate1,
    gate2_holdings: gate2,
    gate3_claimStatus: gate3,
    summary,
    validatedAt: new Date().toISOString(),
  }
}

/**
 * Record a successful claim's social identity binding.
 * Call this AFTER a successful claim to prevent the same social ID
 * from being used with a different wallet.
 */
export function recordSocialClaim(
  walletAddress: string,
  socialIdentity: SocialIdentity
): void {
  const key = socialKey(socialIdentity)
  socialClaimStore.set(key, walletAddress.toLowerCase())
}

/**
 * Check if a social ID has already been used.
 * Useful for pre-validation in the frontend.
 */
export function isSocialIdUsed(identity: SocialIdentity): boolean {
  return socialClaimStore.has(socialKey(identity))
}
