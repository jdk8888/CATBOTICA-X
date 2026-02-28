import { NextRequest, NextResponse } from 'next/server'
import { verifyMessage } from 'viem'
import { z } from 'zod'

// ─────────────────────────────────────────────────────────────
// CATBOTICA LMRP 2026 — Claim API Route
// Lore Anchor: CAT-EVENT-LMRP-2026-HORSE
//
// This handles:
//  1. Zod input validation
//  2. Wallet signature verification
//  3. Duplicate claim prevention (in-memory for MVP)
//  4. Claim recording
//
// TODO: Replace in-memory store with Supabase/PostgreSQL for production
// ─────────────────────────────────────────────────────────────

// ── Zod Schema for API input validation (Pydantic/Zod mandate) ──
const claimRequestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  streetAddress: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  stateProvince: z.string().min(1).max(100),
  postalCode: z.string().min(3).max(20),
  country: z.string().min(2),
  termsAccepted: z.literal(true),
  signature: z.string().min(1),
  signedMessage: z.string().min(1),
  timestamp: z.number(),
  event: z.string().default('LMRP-2026-HORSE'),
})

// ── In-Memory Claim Store (MVP — replace with DB for production) ──
// This persists for the lifetime of the server process.
// For production, use Supabase, Prisma+PostgreSQL, or similar.
interface ClaimRecord {
  claimId: string
  walletAddress: string
  fullName: string
  email: string
  shippingAddress: {
    street: string
    city: string
    stateProvince: string
    postalCode: string
    country: string
  }
  event: string
  signature: string
  timestamp: number
  createdAt: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered'
}

const claimsStore = new Map<string, ClaimRecord>()

// ── Rate limiting (simple per-IP, per Anti-Bloat directive) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const RATE_LIMIT_MAX = 5 // 5 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

// ── Generate claim ID ──
function generateClaimId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `LMRP-${timestamp}-${random}`
}

// ─────────────────────────────────────────────────────────────
// POST /api/claim
// ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before trying again.' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const rawBody = await request.json()
    const parseResult = claimRequestSchema.safeParse(rawBody)

    if (!parseResult.success) {
      const fieldErrors = parseResult.error.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message,
      }))
      return NextResponse.json(
        { error: 'Validation failed', details: fieldErrors },
        { status: 400 }
      )
    }

    const body = parseResult.data

    // ── 1. Check for duplicate claims ──
    const existingClaim = claimsStore.get(body.walletAddress.toLowerCase())
    if (existingClaim) {
      return NextResponse.json(
        {
          error: 'This unit has already completed Luck-Module Recalibration for the 2026 Horse cycle.',
          claimId: existingClaim.claimId,
          claimedAt: existingClaim.createdAt,
        },
        { status: 409 }
      )
    }

    // ── 2. Verify wallet signature ──
    try {
      const isValid = await verifyMessage({
        address: body.walletAddress as `0x${string}`,
        message: body.signedMessage,
        signature: body.signature as `0x${string}`,
      })

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature. Unit authentication failed.' },
          { status: 401 }
        )
      }
    } catch (error) {
      console.error('Signature verification error:', error)
      return NextResponse.json(
        { error: 'Signature verification failed. Please reconnect wallet and retry.' },
        { status: 401 }
      )
    }

    // ── 3. Verify timestamp freshness (prevent replay attacks) ──
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes
    if (Math.abs(now - body.timestamp) > maxAge) {
      return NextResponse.json(
        { error: 'Request expired. Please submit a fresh recalibration request.' },
        { status: 400 }
      )
    }

    // ── 4. Create claim record ──
    const claimId = generateClaimId()
    const claimRecord: ClaimRecord = {
      claimId,
      walletAddress: body.walletAddress.toLowerCase(),
      fullName: body.fullName,
      email: body.email,
      shippingAddress: {
        street: body.streetAddress,
        city: body.city,
        stateProvince: body.stateProvince,
        postalCode: body.postalCode,
        country: body.country,
      },
      event: body.event,
      signature: body.signature,
      timestamp: body.timestamp,
      createdAt: new Date().toISOString(),
      status: 'pending',
    }

    // Store claim (keyed by lowercase wallet address)
    claimsStore.set(body.walletAddress.toLowerCase(), claimRecord)

    console.log(`[LMRP] New claim: ${claimId} | Wallet: ${body.walletAddress} | Name: ${body.fullName}`)

    // ── 5. Return success ──
    return NextResponse.json({
      success: true,
      message: 'Luck-Module Recalibration request accepted.',
      data: {
        claimId,
        walletAddress: body.walletAddress,
        event: body.event,
        status: 'pending',
        estimatedShipping: '2-4 business eternities',
      },
    })
  } catch (error) {
    console.error('[LMRP] Claim API error:', error)
    return NextResponse.json(
      { error: 'Internal system malfunction. Please try again.' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/claim?wallet=0x...
// Check claim status for a wallet
// ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet')

  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json(
      { error: 'Valid wallet address required (?wallet=0x...)' },
      { status: 400 }
    )
  }

  const claim = claimsStore.get(wallet.toLowerCase())

  if (!claim) {
    return NextResponse.json({
      claimed: false,
      message: 'No recalibration record found for this unit.',
    })
  }

  return NextResponse.json({
    claimed: true,
    data: {
      claimId: claim.claimId,
      event: claim.event,
      status: claim.status,
      claimedAt: claim.createdAt,
    },
  })
}
