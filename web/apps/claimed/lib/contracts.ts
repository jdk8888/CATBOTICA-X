/**
 * CATBOTICA — Smart Contract Integration Layer
 * Connects the claim page to the on-chain ERC-1155 + SBT contracts.
 *
 * Lore Anchor: LS-CATBOTICA-ANCHOR-012
 *
 * This module provides:
 *  1. Contract ABIs (minimal, for read/write operations)
 *  2. Contract addresses (per-chain)
 *  3. Server-side mint helpers (for the /api/claim route)
 *  4. Client-side read helpers (for badge status display)
 */

import { type Address } from 'viem'

// ═══════════════════════════════════════════════════════════════
//  CONTRACT ADDRESSES (Per-Chain)
// ═══════════════════════════════════════════════════════════════

/**
 * Deployed contract addresses.
 * Update these after running deploy-all.ts on each target network.
 */
export const CONTRACT_ADDRESSES: Record<
  number,
  { erc1155: Address; sbt: Address }
> = {
  // Base Sepolia (testnet)
  84532: {
    erc1155: '0x0000000000000000000000000000000000000000' as Address, // TODO: Update after deployment
    sbt: '0x0000000000000000000000000000000000000000' as Address, // TODO: Update after deployment
  },
  // Base (mainnet)
  8453: {
    erc1155: '0x0000000000000000000000000000000000000000' as Address, // TODO: Update after deployment
    sbt: '0x0000000000000000000000000000000000000000' as Address, // TODO: Update after deployment
  },
}

// ═══════════════════════════════════════════════════════════════
//  ZODIAC BADGE MAPPING
// ═══════════════════════════════════════════════════════════════

/**
 * Token ID to zodiac mapping (mirrors contract constants).
 * 1=Tiger(2022) through 12=Ox(2033).
 */
export const ZODIAC_BADGES = [
  { tokenId: 1, zodiac: 'Tiger', year: 2022, element: 'Water' },
  { tokenId: 2, zodiac: 'Rabbit', year: 2023, element: 'Water' },
  { tokenId: 3, zodiac: 'Dragon', year: 2024, element: 'Wood' },
  { tokenId: 4, zodiac: 'Snake', year: 2025, element: 'Wood' },
  { tokenId: 5, zodiac: 'Horse', year: 2026, element: 'Fire' },
  { tokenId: 6, zodiac: 'Goat', year: 2027, element: 'Fire' },
  { tokenId: 7, zodiac: 'Monkey', year: 2028, element: 'Earth' },
  { tokenId: 8, zodiac: 'Rooster', year: 2029, element: 'Earth' },
  { tokenId: 9, zodiac: 'Dog', year: 2030, element: 'Metal' },
  { tokenId: 10, zodiac: 'Pig', year: 2031, element: 'Metal' },
  { tokenId: 11, zodiac: 'Rat', year: 2032, element: 'Water' },
  { tokenId: 12, zodiac: 'Ox', year: 2033, element: 'Water' },
] as const

/** Current LMRP cycle (2026 = Horse = tokenId 5). */
export const CURRENT_BADGE_TOKEN_ID = 5

// ═══════════════════════════════════════════════════════════════
//  MINIMAL ABIs (Only functions needed by the claim page)
// ═══════════════════════════════════════════════════════════════

/**
 * CatboticaZodiacBadges (ERC-1155) — Minimal ABI for claim integration.
 */
export const ZODIAC_BADGES_ABI = [
  // ── Write (Minter Role) ──
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'claimId', type: 'string' },
    ],
    name: 'mintBadge',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenIds', type: 'uint256[]' },
      { name: 'claimId', type: 'string' },
    ],
    name: 'batchMintBadges',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ── Read ──
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'wallet', type: 'address' }],
    name: 'getClaimStatus',
    outputs: [{ name: 'claimed', type: 'bool[12]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getActiveBadges',
    outputs: [{ name: 'active', type: 'bool[12]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: '', type: 'address' },
      { name: '', type: 'uint256' },
    ],
    name: 'hasClaimed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'badgeActive',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'uri',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'uint256' }],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

/**
 * CatboticaSoulbound (SBT) — Minimal ABI for claim integration.
 */
export const SOULBOUND_ABI = [
  // ── Write (Minter Role) ──
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'claimId', type: 'string' },
    ],
    name: 'issueProof',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenIds', type: 'uint256[]' },
      { name: 'claimId', type: 'string' },
    ],
    name: 'batchIssueProofs',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ── Read ──
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'unit', type: 'address' }],
    name: 'getRecalibrationStatus',
    outputs: [{ name: 'statuses', type: 'bool[12]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'unit', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    name: 'hasCompletedRecalibration',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ═══════════════════════════════════════════════════════════════
//  HELPER: Get Contract Addresses for Chain
// ═══════════════════════════════════════════════════════════════

/**
 * Get the contract addresses for a specific chain.
 * @param chainId - Target chain ID
 * @returns Contract addresses or null if chain not configured
 */
export function getContractAddresses(
  chainId: number
): { erc1155: Address; sbt: Address } | null {
  return CONTRACT_ADDRESSES[chainId] || null
}

/**
 * Check if contract addresses are configured (not zero address).
 */
export function areContractsDeployed(chainId: number): boolean {
  const addrs = getContractAddresses(chainId)
  if (!addrs) return false
  const zero = '0x0000000000000000000000000000000000000000'
  return addrs.erc1155 !== zero && addrs.sbt !== zero
}
