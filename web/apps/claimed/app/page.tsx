'use client'

import { useAccount, useChainId } from 'wagmi'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect, useCallback } from 'react'
import { WalletConnect } from './components/WalletConnect'
import { MedallionGallery } from './components/MedallionGallery'
import { ClaimPanel } from './components/ClaimPanel'
import { LunarClaimForm } from './components/LunarClaimForm'
import { getWalletProofs } from '@/lib/merkle-proofs'

const BASE_CHAIN_ID = 8453

function LunarHorseSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="56" stroke="url(#lunarGrad)" strokeWidth="2" opacity="0.6" />
      <circle cx="60" cy="60" r="50" stroke="url(#lunarGrad)" strokeWidth="1" opacity="0.3" />
      <g transform="translate(30, 25) scale(0.75)">
        <path
          d="M68 12c-3 0-6 2-7 5l-4 7-6-3c-3-1-6 0-7 3l-3 7-8 3c-4 1-7 5-7 10v8l-5 5c-3 3-3 7-1 10l4 7-2 5c0 3 2 6 4 7h6l4-3 5 2h7l4-4 5-11 4-8 7-5c3-3 4-7 3-11l-2-8V22c0-6-4-10-10-10zm-8 16a4 4 0 110-8 4 4 0 010 8z"
          fill="url(#lunarGrad)"
          opacity="0.8"
        />
      </g>
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

function MedallionGalleryLayout() {
  const { address } = useAccount()
  const chainId = useChainId()
  const [proofs, setProofs] = useState<Record<number, { count: number; proof: string[] }>>({})
  const [claimed, setClaimed] = useState<Record<number, number>>({})
  const [activeYears, setActiveYears] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEligibility = useCallback(async () => {
    if (!address) return
    setLoading(true)
    setError(null)
    try {
      const [proofData, res] = await Promise.all([
        getWalletProofs(address),
        fetch(`/api/claim?wallet=${encodeURIComponent(address)}`),
      ])
      setProofs(proofData)
      if (res.ok) {
        const data = await res.json()
        setClaimed(data.claimed ?? {})
        setActiveYears(data.activeYears ?? [])
      } else {
        setClaimed({})
        setActiveYears([1, 2, 3, 4, 5])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load eligibility')
      setClaimed({})
      setActiveYears([])
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    fetchEligibility()
  }, [fetchEligibility])

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm animate-pulse">
        Loading medallion eligibility…
      </div>
    )
  }
  if (error) {
    return (
      <div className="py-12 text-center text-destructive text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <MedallionGallery
        proofs={proofs}
        claimed={claimed}
        activeYears={activeYears}
      />
      <ClaimPanel
        proofs={proofs}
        claimed={claimed}
        onClaimSuccess={fetchEligibility}
      />
    </div>
  )
}

function LunarClaimPageInner() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'
  const [showLegacyForm, setShowLegacyForm] = useState(false)

  const showContent = isConnected || isPreview
  const isWrongChain = isConnected && chainId !== BASE_CHAIN_ID

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.02] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 sm:py-16">
        {isPreview && (
          <div className="mb-6 bg-secondary/10 border border-secondary/30 rounded-lg px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-secondary">⚠ PREVIEW MODE</span>
              <span className="text-xs text-text-muted">— Wallet gate bypassed.</span>
            </div>
            <a href="/" className="text-xs text-primary hover:underline">Exit Preview</a>
          </div>
        )}

        <header className="text-center mb-10">
          <div className="text-xs text-text-muted tracking-[0.3em] uppercase mb-4">
            CATBOTICA INDUSTRIES — FULFILLMENT CENTER
          </div>
          <div className="flex justify-center mb-6">
            <LunarHorseSVG className="w-28 h-28 animate-float" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-3">
            <span className="text-gold-shimmer">Catbotica</span>
            <br />
            <span className="text-text">Medallions</span>
          </h1>
          <div className="filigree-divider max-w-xs mx-auto my-4" />
          <p className="text-text-muted text-base max-w-lg mx-auto mt-4 leading-relaxed">
            Claim your Medallions by year. Connect your wallet on Base to see eligibility and claim in one transaction.
          </p>
        </header>

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
          <span className="text-xs text-text-muted font-mono">v2026.MEDALLIONS</span>
        </div>

        {!isPreview && (
          <div className="mb-8 flex justify-center">
            <WalletConnect />
          </div>
        )}

        {!showContent ? (
          <div className="bg-background-light border border-background-lighter rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-display font-bold text-text mb-2">Unit Authentication Required</h2>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              Connect your wallet on Base to view and claim your Medallions.
            </p>
          </div>
        ) : isWrongChain ? (
          <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-6 text-center">
            <p className="text-amber-700 dark:text-amber-400 font-medium">Please switch to Base network to claim.</p>
            <p className="text-sm text-muted-foreground mt-2">Chain ID: {BASE_CHAIN_ID}</p>
          </div>
        ) : showLegacyForm ? (
          <LunarClaimForm />
        ) : (
          <MedallionGalleryLayout />
        )}

        {showContent && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setShowLegacyForm((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              {showLegacyForm ? 'Back to Medallions' : 'Legacy fulfillment form (shipping)'}
            </button>
          </div>
        )}

        <footer className="mt-12 text-center">
          <div className="filigree-divider mb-6" />
          <p className="text-text-muted text-xs">CATBOTICA Inc. — Fulfillment Center</p>
          <p className="text-text-muted/50 text-xs mt-1 font-mono">CAT-EVENT-LMRP-2026-HORSE</p>
        </footer>
      </div>
    </main>
  )
}

export default function LunarClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-text-muted text-sm animate-pulse">Initializing…</div>
        </div>
      }
    >
      <LunarClaimPageInner />
    </Suspense>
  )
}
