/**
 * CATBOTICA Medallions — Merkle-based eligibility (Phase 3).
 * Replaces three-gate validation with proof lookup + on-chain claimed status.
 * Legacy types (SocialPlatform, SocialIdentity, etc.) kept for backward compatibility.
 * CATBOTICA_MEDALLIONS_CURSOR_HANDOFF.md Phase 3.
 */

import type { WalletProofs } from './merkle-proofs'

// ─────────────────────────────────────────────────────────────
//  LEGACY TYPES (kept for LunarClaimForm / any remaining UI)
// ─────────────────────────────────────────────────────────────

export type SocialPlatform = 'discord' | 'kakao'

export interface SocialIdentity {
  platform: SocialPlatform
  userId: string
}

export interface GateResult {
  passed: boolean
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface ClaimValidationResult {
  eligible: boolean
  gate1_identity: GateResult
  gate2_holdings: GateResult
  gate3_claimStatus: GateResult
  summary: string
  validatedAt: string
}

// ─────────────────────────────────────────────────────────────
//  MERKLE ELIGIBILITY
// ─────────────────────────────────────────────────────────────

export interface MedallionEligibility {
  /** Years the wallet has a proof and can claim (count per year). */
  eligible: { yearId: number; count: number }[]
  /** Years already claimed (claimed count per year from chain). */
  claimed: Record<number, number>
  /** Years with Merkle root set (claimable). */
  activeYears: number[]
}

/**
 * Combine proof data and on-chain claimed counts for UI.
 * Caller provides proofs (from getWalletProofs) and claimed from API or chain.
 */
export function getMedallionEligibility(
  proofs: WalletProofs,
  claimed: Record<number, number>,
  activeYears: number[]
): MedallionEligibility {
  const eligible: { yearId: number; count: number }[] = []
  for (const yearId of [1, 2, 3, 4, 5] as const) {
    const p = proofs[yearId]
    if (p && p.count > 0) {
      eligible.push({ yearId, count: p.count })
    }
  }
  return {
    eligible,
    claimed: { ...claimed },
    activeYears: [...activeYears],
  }
}

/** Card status per year for MedallionCard. */
export type MedallionCardStatus = 'ineligible' | 'unclaimed' | 'claimed' | 'locked'

export function getMedallionCardStatus(
  yearId: number,
  proofs: WalletProofs,
  claimed: Record<number, number>,
  activeYears: number[]
): MedallionCardStatus {
  const isActive = activeYears.includes(yearId)
  const proof = proofs[yearId]
  const claimedCount = claimed[yearId] ?? 0

  if (!isActive) return 'locked'
  if (!proof || proof.count === 0) return 'ineligible'
  if (claimedCount >= proof.count) return 'claimed'
  return 'unclaimed'
}

// ─────────────────────────────────────────────────────────────
//  LEGACY HELPERS (kept for form validation if needed)
// ─────────────────────────────────────────────────────────────

export function isValidDiscordId(id: string): boolean {
  const newFormat = /^[a-z0-9._]{2,32}$/
  const legacyFormat = /^.{2,32}#\d{4}$/
  return newFormat.test(id) || legacyFormat.test(id)
}

export function isValidKakaoId(id: string): boolean {
  return /^[a-zA-Z0-9_]{2,20}$/.test(id)
}

export function isValidSocialIdentity(identity: SocialIdentity): boolean {
  if (identity.platform === 'discord') return isValidDiscordId(identity.userId)
  if (identity.platform === 'kakao') return isValidKakaoId(identity.userId)
  return false
}

// ─────────────────────────────────────────────────────────────
//  LEGACY STUBS (no longer used for Medallions; prevent breakage)
// ─────────────────────────────────────────────────────────────

/**
 * @deprecated Medallions use Merkle proof eligibility. Use getWalletProofs + API GET /api/claim instead.
 */
export async function validateClaim(): Promise<ClaimValidationResult> {
  return {
    eligible: false,
    gate1_identity: { passed: false, code: 'DEPRECATED', message: 'Use Merkle eligibility for Medallions.' },
    gate2_holdings: { passed: false, code: 'DEPRECATED', message: '' },
    gate3_claimStatus: { passed: false, code: 'DEPRECATED', message: '' },
    summary: 'Medallions flow uses Merkle proofs; validateClaim is deprecated.',
    validatedAt: new Date().toISOString(),
  }
}

/**
 * @deprecated No server-side claim recording for Medallions. No-op.
 */
export function recordSocialClaim(): void {
  /* no-op for Medallions flow */
}
