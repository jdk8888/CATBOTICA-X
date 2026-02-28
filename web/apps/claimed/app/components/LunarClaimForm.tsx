'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { z } from 'zod'

// ─────────────────────────────────────────────────────────────
// ZOD SCHEMA — Strict validation per Anti-Bloat Protocol
// ─────────────────────────────────────────────────────────────
const shippingSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be under 100 characters')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters'),
  email: z
    .string()
    .email('Invalid email address'),
  streetAddress: z
    .string()
    .min(5, 'Street address is required')
    .max(200, 'Address too long'),
  city: z
    .string()
    .min(2, 'City is required')
    .max(100, 'City name too long'),
  stateProvince: z
    .string()
    .min(1, 'State/Province is required')
    .max(100, 'State/Province name too long'),
  postalCode: z
    .string()
    .min(3, 'Postal code is required')
    .max(20, 'Postal code too long'),
  country: z
    .string()
    .min(2, 'Country is required'),
})

const claimSchema = shippingSchema.extend({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  termsAccepted: z
    .literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
})

type ClaimFormData = z.infer<typeof claimSchema>
type FormErrors = Partial<Record<keyof ClaimFormData, string>>

// ─────────────────────────────────────────────────────────────
// CLAIM STATES
// ─────────────────────────────────────────────────────────────
type ClaimState =
  | 'idle'
  | 'signing'
  | 'submitting'
  | 'success'
  | 'error_already_claimed'
  | 'error_invalid_wallet'
  | 'error_generic'

// ─────────────────────────────────────────────────────────────
// COUNTRIES LIST (Subset for fulfillment regions)
// ─────────────────────────────────────────────────────────────
const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'SG', label: 'Singapore' },
  { value: 'AU', label: 'Australia' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'DK', label: 'Denmark' },
  { value: 'AT', label: 'Austria' },
  { value: 'BE', label: 'Belgium' },
  { value: 'IT', label: 'Italy' },
  { value: 'ES', label: 'Spain' },
  { value: 'PT', label: 'Portugal' },
  { value: 'IE', label: 'Ireland' },
  { value: 'PL', label: 'Poland' },
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'TH', label: 'Thailand' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'PH', label: 'Philippines' },
  { value: 'IN', label: 'India' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CL', label: 'Chile' },
  { value: 'CO', label: 'Colombia' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'IL', label: 'Israel' },
  { value: 'TR', label: 'Turkey' },
  { value: 'FI', label: 'Finland' },
] as const

// ─────────────────────────────────────────────────────────────
// CONFETTI ENGINE — Pure canvas, no external dependency
// ─────────────────────────────────────────────────────────────
function launchConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const COLORS = ['#C41E3A', '#FFD700', '#E63950', '#D4AF37', '#B8960F', '#FFE44D', '#FF6B6B']
  const PARTICLE_COUNT = 150

  interface Particle {
    x: number; y: number; vx: number; vy: number
    size: number; color: string; rotation: number
    rotationSpeed: number; opacity: number; shape: 'rect' | 'circle'
  }

  const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * 200,
    vx: (Math.random() - 0.5) * 8,
    vy: Math.random() * 3 + 2,
    size: Math.random() * 8 + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.15,
    opacity: 1,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
  }))

  let frame = 0
  const maxFrames = 180 // ~3 seconds at 60fps

  function animate() {
    if (frame > maxFrames) {
      ctx!.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    ctx!.clearRect(0, 0, canvas.width, canvas.height)

    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.08 // gravity
      p.vx *= 0.99 // air resistance
      p.rotation += p.rotationSpeed
      p.opacity = Math.max(0, 1 - frame / maxFrames)

      ctx!.save()
      ctx!.translate(p.x, p.y)
      ctx!.rotate(p.rotation)
      ctx!.globalAlpha = p.opacity
      ctx!.fillStyle = p.color

      if (p.shape === 'rect') {
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      } else {
        ctx!.beginPath()
        ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx!.fill()
      }

      ctx!.restore()
    }

    frame++
    requestAnimationFrame(animate)
  }

  animate()
}

// ─────────────────────────────────────────────────────────────
// HORSE GLYPH — SVG inline for the Year of the Horse motif
// ─────────────────────────────────────────────────────────────
function HorseGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M48 8c-2 0-4 1-5 3l-3 5-4-2c-2-1-4 0-5 2l-2 5-6 2c-3 1-5 4-5 7v6l-4 4c-2 2-2 5-1 7l3 5-1 4c0 2 1 4 3 5h4l3-2 4 1h5l3-3 4-8 3-6 5-4c2-2 3-5 2-8l-1-6V16c0-4-3-8-7-8zm-6 12a3 3 0 110-6 3 3 0 010 6z"/>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export function LunarClaimForm() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const confettiRef = useRef<HTMLCanvasElement>(null)

  // ── Form State ──
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    streetAddress: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: '',
    termsAccepted: false,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [claimState, setClaimState] = useState<ClaimState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [claimId, setClaimId] = useState<string | null>(null)

  // ── Auto-populate wallet ──
  const walletAddress = address || ''

  // ── Field update handler ──
  const updateField = useCallback(<K extends keyof typeof formData>(
    field: K,
    value: typeof formData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error on change
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }, [errors])

  // ── Validate all fields ──
  const validateForm = useCallback((): boolean => {
    const result = claimSchema.safeParse({
      ...formData,
      walletAddress,
    })

    if (!result.success) {
      const fieldErrors: FormErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ClaimFormData
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      }
      setErrors(fieldErrors)
      return false
    }

    setErrors({})
    return true
  }, [formData, walletAddress])

  // ── Submit handler ──
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      setClaimState('error_invalid_wallet')
      setErrorMessage('Please connect your wallet to proceed with recalibration.')
      return
    }

    if (!validateForm()) return

    // Step 1: Sign message
    setClaimState('signing')

    let signature: string
    const timestamp = Date.now()
    const message = `CATBOTICA LMRP 2026 — Luck-Module Recalibration Request\n\nI, ${formData.fullName}, authorize the recalibration of my unit's Luck-Module for the Year of the Horse cycle.\n\nTimestamp: ${timestamp}\nUnit ID: ${address}`

    try {
      signature = await signMessageAsync({ message })
    } catch {
      setClaimState('idle')
      return // User rejected signature — return to form silently
    }

    // Step 2: Submit claim
    setClaimState('submitting')

    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          fullName: formData.fullName,
          email: formData.email,
          streetAddress: formData.streetAddress,
          city: formData.city,
          stateProvince: formData.stateProvince,
          postalCode: formData.postalCode,
          country: formData.country,
          termsAccepted: formData.termsAccepted,
          signature,
          signedMessage: message,
          timestamp,
          event: 'LMRP-2026-HORSE',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          setClaimState('error_already_claimed')
          setErrorMessage(result.error || 'This unit has already completed recalibration for this cycle.')
          return
        }
        if (response.status === 403) {
          setClaimState('error_invalid_wallet')
          setErrorMessage(result.error || 'This wallet is not eligible for recalibration.')
          return
        }
        throw new Error(result.error || 'Recalibration request failed')
      }

      // SUCCESS
      setClaimId(result.data?.claimId || `LMRP-${timestamp}`)
      setClaimState('success')

      // Fire confetti
      if (confettiRef.current) {
        launchConfetti(confettiRef.current)
      }
    } catch (err) {
      setClaimState('error_generic')
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.')
    }
  }, [isConnected, address, formData, validateForm, signMessageAsync])

  // ── Reset handler ──
  const handleReset = useCallback(() => {
    setClaimState('idle')
    setErrorMessage('')
    setErrors({})
  }, [])

  // ─────────────────────────────────────────────────────────
  // RENDER: SUCCESS STATE
  // ─────────────────────────────────────────────────────────
  if (claimState === 'success') {
    return (
      <>
        <canvas
          ref={confettiRef}
          className="fixed inset-0 pointer-events-none z-50"
          style={{ width: '100vw', height: '100vh' }}
        />
        <div className="bg-background-light border border-secondary/30 rounded-2xl p-10 text-center animate-pulse-gold">
          {/* Badge placeholder */}
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-float">
            <HorseGlyph className="w-16 h-16 text-background" />
          </div>

          <h2 className="text-3xl font-display font-bold text-gold-shimmer mb-3">
            Recalibration Complete
          </h2>

          <p className="text-text-muted text-lg mb-6">
            Your Luck-Module has been synchronized with the Year of the Horse frequency.
            Enhanced probability matrices are now active.
          </p>

          <div className="inline-block bg-background border border-secondary/20 rounded-lg px-6 py-3 mb-6">
            <span className="text-xs text-text-muted block mb-1">RECALIBRATION ID</span>
            <span className="font-mono text-secondary text-sm">{claimId}</span>
          </div>

          <div className="filigree-divider my-6" />

          <div className="grid grid-cols-3 gap-4 text-center mb-6">
            <div>
              <span className="text-2xl">🐴</span>
              <p className="text-xs text-text-muted mt-1">Horse Frequency</p>
              <p className="text-secondary font-bold">Locked</p>
            </div>
            <div>
              <span className="text-2xl">⚡</span>
              <p className="text-xs text-text-muted mt-1">Velocitite Boost</p>
              <p className="text-secondary font-bold">+15%</p>
            </div>
            <div>
              <span className="text-2xl">🔮</span>
              <p className="text-xs text-text-muted mt-1">Aurum Resonance</p>
              <p className="text-secondary font-bold">Active</p>
            </div>
          </div>

          <p className="text-sm text-text-muted">
            Your badge will be shipped to the address provided within 2-4 business eternities.
            <br />A confirmation has been sent to <span className="text-text">{formData.email}</span>.
          </p>
        </div>
      </>
    )
  }

  // ─────────────────────────────────────────────────────────
  // RENDER: ERROR STATES
  // ─────────────────────────────────────────────────────────
  if (claimState === 'error_already_claimed') {
    return (
      <div className="bg-background-light border border-secondary/30 rounded-2xl p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-display font-bold text-secondary mb-3">
          Already Recalibrated
        </h2>
        <p className="text-text-muted mb-6">
          {errorMessage}
        </p>
        <p className="text-sm text-text-muted mb-6">
          Each unit may only complete one Luck-Module Recalibration per Lunar cycle.
          Your badge is already in transit.
        </p>
        <button
          onClick={handleReset}
          className="px-6 py-3 border border-secondary/30 text-secondary rounded-lg hover:bg-secondary/10 transition-colors font-display"
        >
          Return to Terminal
        </button>
      </div>
    )
  }

  if (claimState === 'error_invalid_wallet') {
    return (
      <div className="bg-background-light border border-primary/30 rounded-2xl p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728A9 9 0 015.636 5.636" />
          </svg>
        </div>
        <h2 className="text-2xl font-display font-bold text-primary mb-3">
          Ineligible Unit Detected
        </h2>
        <p className="text-text-muted mb-6">
          {errorMessage}
        </p>
        <p className="text-sm text-text-muted mb-6">
          Only registered Catbotica units (NFT holders) or mission-completers
          are eligible for Luck-Module Recalibration.
        </p>
        <button
          onClick={handleReset}
          className="px-6 py-3 border border-primary/30 text-primary rounded-lg hover:bg-primary/10 transition-colors font-display"
        >
          Try Different Wallet
        </button>
      </div>
    )
  }

  if (claimState === 'error_generic') {
    return (
      <div className="bg-background-light border border-primary/30 rounded-2xl p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-display font-bold text-primary mb-3">
          System Malfunction
        </h2>
        <p className="text-text-muted mb-6">{errorMessage}</p>
        <button
          onClick={handleReset}
          className="px-6 py-3 border border-primary/30 text-primary rounded-lg hover:bg-primary/10 transition-colors font-display"
        >
          Retry Recalibration
        </button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────
  // RENDER: FORM (idle / signing / submitting)
  // ─────────────────────────────────────────────────────────
  const isProcessing = claimState === 'signing' || claimState === 'submitting'

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* ── Section: Unit Identity ── */}
      <div className="bg-background-light border border-background-lighter rounded-2xl p-6">
        <h3 className="text-sm font-display font-bold text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-secondary/20 flex items-center justify-center text-xs text-secondary">1</span>
          Unit Identification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-text mb-1.5">
              Operator Name <span className="text-primary">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="Enter your full name"
              disabled={isProcessing}
              className={`w-full px-4 py-3 bg-background border rounded-lg text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                errors.fullName
                  ? 'border-primary focus:ring-primary/40'
                  : 'border-background-lighter focus:ring-secondary/40 focus:border-secondary/50'
              }`}
            />
            {errors.fullName && (
              <p className="text-primary text-xs mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text mb-1.5">
              Comm Channel (Email) <span className="text-primary">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="operator@catbotica.com"
              disabled={isProcessing}
              className={`w-full px-4 py-3 bg-background border rounded-lg text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                errors.email
                  ? 'border-primary focus:ring-primary/40'
                  : 'border-background-lighter focus:ring-secondary/40 focus:border-secondary/50'
              }`}
            />
            {errors.email && (
              <p className="text-primary text-xs mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Wallet (auto-populated, read-only) */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-text mb-1.5">
            Unit ID (Wallet) <span className="text-primary">*</span>
          </label>
          <div className="w-full px-4 py-3 bg-background border border-background-lighter rounded-lg text-text-muted font-mono text-sm flex items-center gap-2">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="truncate">{walletAddress}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="italic">Connect wallet above to populate</span>
              </>
            )}
          </div>
          {errors.walletAddress && (
            <p className="text-primary text-xs mt-1">{errors.walletAddress}</p>
          )}
        </div>
      </div>

      {/* ── Section: Shipping / Fulfillment ── */}
      <div className="bg-background-light border border-background-lighter rounded-2xl p-6">
        <h3 className="text-sm font-display font-bold text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-secondary/20 flex items-center justify-center text-xs text-secondary">2</span>
          Fulfillment Coordinates
        </h3>

        {/* Street Address */}
        <div className="mb-4">
          <label htmlFor="streetAddress" className="block text-sm font-medium text-text mb-1.5">
            Street Address <span className="text-primary">*</span>
          </label>
          <input
            id="streetAddress"
            type="text"
            value={formData.streetAddress}
            onChange={(e) => updateField('streetAddress', e.target.value)}
            placeholder="123 Catbotica Campus Drive"
            disabled={isProcessing}
            className={`w-full px-4 py-3 bg-background border rounded-lg text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
              errors.streetAddress
                ? 'border-primary focus:ring-primary/40'
                : 'border-background-lighter focus:ring-secondary/40 focus:border-secondary/50'
            }`}
          />
          {errors.streetAddress && (
            <p className="text-primary text-xs mt-1">{errors.streetAddress}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-text mb-1.5">
              City <span className="text-primary">*</span>
            </label>
            <input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="Neo Tokyo"
              disabled={isProcessing}
              className={`w-full px-4 py-3 bg-background border rounded-lg text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                errors.city
                  ? 'border-primary focus:ring-primary/40'
                  : 'border-background-lighter focus:ring-secondary/40 focus:border-secondary/50'
              }`}
            />
            {errors.city && (
              <p className="text-primary text-xs mt-1">{errors.city}</p>
            )}
          </div>

          {/* State/Province */}
          <div>
            <label htmlFor="stateProvince" className="block text-sm font-medium text-text mb-1.5">
              State / Province <span className="text-primary">*</span>
            </label>
            <input
              id="stateProvince"
              type="text"
              value={formData.stateProvince}
              onChange={(e) => updateField('stateProvince', e.target.value)}
              placeholder="Sector 7-G"
              disabled={isProcessing}
              className={`w-full px-4 py-3 bg-background border rounded-lg text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                errors.stateProvince
                  ? 'border-primary focus:ring-primary/40'
                  : 'border-background-lighter focus:ring-secondary/40 focus:border-secondary/50'
              }`}
            />
            {errors.stateProvince && (
              <p className="text-primary text-xs mt-1">{errors.stateProvince}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Postal Code */}
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-text mb-1.5">
              Postal Code <span className="text-primary">*</span>
            </label>
            <input
              id="postalCode"
              type="text"
              value={formData.postalCode}
              onChange={(e) => updateField('postalCode', e.target.value)}
              placeholder="00000"
              disabled={isProcessing}
              className={`w-full px-4 py-3 bg-background border rounded-lg text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                errors.postalCode
                  ? 'border-primary focus:ring-primary/40'
                  : 'border-background-lighter focus:ring-secondary/40 focus:border-secondary/50'
              }`}
            />
            {errors.postalCode && (
              <p className="text-primary text-xs mt-1">{errors.postalCode}</p>
            )}
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-text mb-1.5">
              Country <span className="text-primary">*</span>
            </label>
            <select
              id="country"
              value={formData.country}
              onChange={(e) => updateField('country', e.target.value)}
              disabled={isProcessing}
              className={`w-full px-4 py-3 bg-background border rounded-lg text-text focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                errors.country
                  ? 'border-primary focus:ring-primary/40'
                  : 'border-background-lighter focus:ring-secondary/40 focus:border-secondary/50'
              }`}
            >
              <option value="">— Select Country —</option>
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="text-primary text-xs mt-1">{errors.country}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Section: Authorization ── */}
      <div className="bg-background-light border border-background-lighter rounded-2xl p-6">
        <h3 className="text-sm font-display font-bold text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-secondary/20 flex items-center justify-center text-xs text-secondary">3</span>
          Authorization Protocol
        </h3>

        <div className="p-4 bg-background rounded-lg border border-background-lighter mb-4">
          <p className="text-xs text-text-muted font-mono leading-relaxed">
            By submitting this Luck-Module Recalibration Request, I confirm that I am the
            authorized operator of the connected wallet unit. I understand that this is a
            one-time recalibration per Lunar cycle and that my physical badge will be shipped
            to the fulfillment coordinates provided above. I accept the{' '}
            <a href="/terms" className="text-primary hover:text-primary-light underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary hover:text-primary-light underline">
              Privacy Protocol
            </a>.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.termsAccepted}
            onChange={(e) => updateField('termsAccepted', e.target.checked as any)}
            disabled={isProcessing}
            className="mt-1 w-5 h-5 rounded border-background-lighter bg-background text-primary focus:ring-primary focus:ring-2 accent-primary"
          />
          <span className="text-sm text-text-muted group-hover:text-text transition-colors">
            I accept the Terms of Service and authorize this recalibration request
            <span className="text-primary ml-1">*</span>
          </span>
        </label>
        {errors.termsAccepted && (
          <p className="text-primary text-xs mt-2 ml-8">{errors.termsAccepted}</p>
        )}
      </div>

      {/* ── Submit Button ── */}
      <button
        type="submit"
        disabled={!isConnected || isProcessing}
        className="w-full py-4 px-6 bg-gradient-to-r from-primary via-primary-dark to-primary text-text font-display font-bold text-lg rounded-xl hover:from-primary-light hover:via-primary hover:to-primary-light transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-primary/40 relative overflow-hidden group"
      >
        {/* Gold accent line */}
        <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-secondary to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

        {claimState === 'signing' ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Awaiting Signature Authorization...
          </span>
        ) : claimState === 'submitting' ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Recalibrating Luck-Module...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <HorseGlyph className="w-5 h-5" />
            Initiate Luck-Module Recalibration
          </span>
        )}
      </button>
    </form>
  )
}
