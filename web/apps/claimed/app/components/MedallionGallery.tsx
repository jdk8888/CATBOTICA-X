'use client'

import { useMemo } from 'react'
import { MedallionCard } from './MedallionCard'
import { getMedallionCardStatus } from '@/lib/claim-validator'
import type { WalletProofs } from '@/lib/merkle-proofs'
import { MEDALLIONS_ZODIAC } from '@/lib/contracts'

const YEAR_LABELS: Record<number, string> = {
  1: '2022',
  2: '2023',
  3: '2024',
  4: '2025',
  5: '2026',
}

const DEFAULT_FRONT = 'https://placehold.co/400x400/0D0D0D/00F2FF?text=Medallion'
const DEFAULT_BACK = 'https://placehold.co/400x400/0D0D0D/C41E3A?text=Tails'

export interface MedallionGalleryProps {
  proofs: WalletProofs
  claimed: Record<number, number>
  activeYears: number[]
  /** Optional: override front image per yearId (IPFS or URL). */
  frontImages?: Record<number, string>
  /** Optional: shared back image. */
  backImage?: string
}

export function MedallionGallery({
  proofs,
  claimed,
  activeYears,
  frontImages = {},
  backImage = DEFAULT_BACK,
}: MedallionGalleryProps) {
  const cards = useMemo(() => {
    const yearIds = [1, 2, 3, 4, 5] as const
    return yearIds.map((yearId) => {
      const zodiac = MEDALLIONS_ZODIAC[yearId] ?? '?'
      const year = YEAR_LABELS[yearId] ?? ''
      const proof = proofs[yearId]
      const count = proof?.count ?? 0
      const status = getMedallionCardStatus(yearId, proofs, claimed, activeYears)
      const frontImage = frontImages[yearId] ?? DEFAULT_FRONT
      return {
        yearId,
        zodiac,
        year,
        count,
        status,
        frontImage,
        backImage,
      }
    })
  }, [proofs, claimed, activeYears, frontImages, backImage])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {cards.map((card) => (
        <MedallionCard
          key={card.yearId}
          yearId={card.yearId}
          zodiac={card.zodiac}
          year={card.year}
          count={card.count}
          status={card.status}
          frontImage={card.frontImage}
          backImage={card.backImage}
        />
      ))}
    </div>
  )
}
