'use client'

import { useAccount } from 'wagmi'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { WalletConnect } from './components/WalletConnect'
import { LunarClaimForm } from './components/LunarClaimForm'

// ─────────────────────────────────────────────────────────────
// CATBOTICA — Luck-Module Recalibration Protocol
// Year of the Horse 2026
// Lore Anchor: CAT-EVENT-LMRP-2026-HORSE
//
// Preview Mode: Add ?preview=true to URL to bypass wallet gate
// ─────────────────────────────────────────────────────────────

function LunarHorseSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer ring */}
      <circle cx="60" cy="60" r="56" stroke="url(#lunarGrad)" strokeWidth="2" opacity="0.6" />
      <circle cx="60" cy="60" r="50" stroke="url(#lunarGrad)" strokeWidth="1" opacity="0.3" />
      {/* Horse silhouette (simplified) */}
      <g transform="translate(30, 25) scale(0.75)">
        <path
          d="M68 12c-3 0-6 2-7 5l-4 7-6-3c-3-1-6 0-7 3l-3 7-8 3c-4 1-7 5-7 10v8l-5 5c-3 3-3 7-1 10l4 7-2 5c0 3 2 6 4 7h6l4-3 5 2h7l4-4 5-11 4-8 7-5c3-3 4-7 3-11l-2-8V22c0-6-4-10-10-10zm-8 16a4 4 0 110-8 4 4 0 010 8z"
          fill="url(#lunarGrad)"
          opacity="0.8"
        />
      </g>
      {/* Filigree tick marks */}
      <path d="M60 8 L60 4" stroke="#FFD700" strokeWidth="1.5" opacity="0.5" />
      <path d="M60 116 L60 112" stroke="#FFD700" strokeWidth="1.5" opacity="0.5" />
      <path d="M8 60 L4 60" stroke="#FFD700" strokeWidth="1.5" opacity="0.5" />
      <path d="M116 60 L112 60" stroke="#FFD700" strokeWidth="1.5" opacity="0.5" />
      <defs>
        <linearGradient id="lunarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C41E3A" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#C41E3A" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function LunarClaimPageInner() {
  const { isConnected } = useAccount()
  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'

  // In preview mode, treat as "connected" to show the full form
  const showForm = isConnected || isPreview

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* ── Background decoration ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.02] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12 sm:py-16">
        {/* ── Preview Mode Banner ── */}
        {isPreview && (
          <div className="mb-6 bg-secondary/10 border border-secondary/30 rounded-lg px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-secondary">⚠ PREVIEW MODE</span>
              <span className="text-xs text-text-muted">— Wallet gate bypassed. Form is non-functional.</span>
            </div>
            <a href="/" className="text-xs text-primary hover:text-primary-light underline">
              Exit Preview
            </a>
          </div>
        )}

        {/* ── Header ── */}
        <header className="text-center mb-10">
          <div className="text-xs text-text-muted tracking-[0.3em] uppercase mb-4">
            CATBOTICA INDUSTRIES — FULFILLMENT CENTER
          </div>

          {/* Lunar Horse Badge */}
          <div className="flex justify-center mb-6">
            <LunarHorseSVG className="w-28 h-28 animate-float" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-3">
            <span className="text-gold-shimmer">Catbotica</span>
            <br />
            <span className="text-text">Lunar New Year</span>
          </h1>

          <div className="filigree-divider max-w-xs mx-auto my-4" />

          <p className="text-sm text-secondary font-display tracking-wider uppercase">
            Year of the Fire Horse — 2026
          </p>

          <p className="text-text-muted text-base max-w-lg mx-auto mt-4 leading-relaxed">
            Celebrate the Year of the Fire Horse with Catbotica.
            Claim your exclusive Lunar New Year badge below.
          </p>
        </header>

        {/* ── Status Banner ── */}
        <div className="bg-background-light/50 border border-secondary/10 rounded-xl p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary/60" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary" />
            </span>
            <span className="text-sm text-text-muted">
              Claim Status: <span className="text-secondary font-medium">ACTIVE</span>
            </span>
          </div>
          <span className="text-xs text-text-muted font-mono">
            v2026.FIRE-HORSE
          </span>
        </div>

        {/* ── Wallet Connection (hidden in preview mode) ── */}
        {!isPreview && (
          <div className="mb-8 flex justify-center">
            <WalletConnect />
          </div>
        )}

        {/* ── Main Content ── */}
        {!showForm ? (
          <div className="bg-background-light border border-background-lighter rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-display font-bold text-text mb-2">
              Unit Authentication Required
            </h2>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              Connect your wallet to verify your identity and claim your
              exclusive Lunar New Year badge.
            </p>
          </div>
        ) : (
          <LunarClaimForm />
        )}

        {/* ── Info Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
          <div className="bg-background-light/50 border border-background-lighter rounded-xl p-4 text-center">
            <span className="text-2xl mb-2 block">🐴</span>
            <h4 className="text-xs font-display font-bold text-secondary uppercase tracking-wider mb-1">
              Horse Frequency
            </h4>
            <p className="text-xs text-text-muted">
              Speed, courage, forward momentum
            </p>
          </div>
          <div className="bg-background-light/50 border border-background-lighter rounded-xl p-4 text-center">
            <span className="text-2xl mb-2 block">⚡</span>
            <h4 className="text-xs font-display font-bold text-secondary uppercase tracking-wider mb-1">
              Velocitite Link
            </h4>
            <p className="text-xs text-text-muted">
              Elemental resonance amplified
            </p>
          </div>
          <div className="bg-background-light/50 border border-background-lighter rounded-xl p-4 text-center">
            <span className="text-2xl mb-2 block">🔮</span>
            <h4 className="text-xs font-display font-bold text-secondary uppercase tracking-wider mb-1">
              Aurum Boost
            </h4>
            <p className="text-xs text-text-muted">
              Luminary elemental enhanced
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="mt-12 text-center">
          <div className="filigree-divider mb-6" />
          <p className="text-text-muted text-xs">
            CATBOTICA Inc. — Fulfillment Center
          </p>
          <p className="text-text-muted/50 text-xs mt-1">
            Catbotica Lunar New Year v2026.FIRE-HORSE
            <br />
            Standard processing time: 2-4 business eternities
          </p>
          <p className="text-text-muted/30 text-xs mt-3 font-mono">
            CAT-EVENT-LMRP-2026-HORSE
          </p>
        </footer>
      </div>
    </main>
  )
}

// Wrap in Suspense for useSearchParams
export default function LunarClaimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-muted text-sm animate-pulse">Initializing LMRP...</div>
      </div>
    }>
      <LunarClaimPageInner />
    </Suspense>
  )
}
