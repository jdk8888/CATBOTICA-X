'use client'

import { useState, useEffect } from 'react'
import type { MedallionCardStatus } from '@/lib/claim-validator'

export interface MedallionCardProps {
  yearId: number
  zodiac: string
  year: string
  count: number
  status: MedallionCardStatus
  frontImage: string
  backImage: string
}

export function MedallionCard({
  yearId,
  zodiac,
  year,
  count,
  status,
  frontImage,
  backImage,
}: MedallionCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [hasFlipped, setHasFlipped] = useState(false)

  useEffect(() => {
    if (status === 'claimed' && !hasFlipped) {
      setFlipped(true)
      setHasFlipped(true)
    }
  }, [status, hasFlipped])

  const isClickable = status === 'unclaimed' || status === 'claimed'
  const isLocked = status === 'locked'
  const isIneligible = status === 'ineligible'

  return (
    <div
      className="relative w-full aspect-square max-w-[200px] mx-auto cursor-pointer perspective-1000"
      style={{ perspective: '1000px' }}
      onClick={() => isClickable && setFlipped((f) => !f)}
    >
      <div
        className="relative w-full h-full transition-transform duration-500 preserve-3d"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl border-2 bg-card overflow-hidden backface-hidden flex flex-col items-center justify-center p-2"
          style={{
            backfaceVisibility: 'hidden',
            borderColor:
              status === 'unclaimed'
                ? 'rgba(255, 215, 0, 0.8)'
                : status === 'claimed'
                  ? 'rgba(0, 242, 255, 0.5)'
                  : isLocked
                    ? 'rgba(128, 128, 128, 0.5)'
                    : 'rgba(0,0,0,0.2)',
            boxShadow: status === 'unclaimed' ? '0 0 20px rgba(255, 215, 0, 0.4)' : undefined,
          }}
        >
          <div
            className="w-full h-full bg-cover bg-center rounded-xl"
            style={{
              backgroundImage: `url(${frontImage})`,
              opacity: isIneligible || isLocked ? 0.5 : 1,
            }}
          />
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-xs">
            <span className="font-semibold text-foreground">
              {zodiac} ({year})
            </span>
            {status === 'unclaimed' && (
              <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground font-medium">
                Claim
              </span>
            )}
            {status === 'claimed' && count > 0 && (
              <span className="px-2 py-0.5 rounded bg-secondary/20 text-secondary">
                ×{count}
              </span>
            )}
            {status === 'locked' && (
              <span className="text-muted-foreground">Locked</span>
            )}
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl border-2 border-primary/30 bg-card overflow-hidden backface-hidden flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div
            className="w-full h-full bg-cover bg-center rounded-xl"
            style={{ backgroundImage: `url(${backImage})` }}
          />
          <div className="absolute bottom-2 left-2 right-2 text-center text-xs font-medium text-foreground">
            {zodiac} — {year}
          </div>
        </div>
      </div>
    </div>
  )
}
