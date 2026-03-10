'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { getMedallionsAddress, MEDALLIONS_ABI } from '@/lib/contracts'
import type { WalletProofs } from '@/lib/merkle-proofs'

const BASE_CHAIN_ID = 8453

export type ClaimTxState = 'idle' | 'pending' | 'confirmed' | 'error'

export interface ClaimPanelProps {
  proofs: WalletProofs
  claimed: Record<number, number>
  /** Callback after a successful claim (e.g. refetch eligibility, trigger card flip). */
  onClaimSuccess?: () => void
}

export function ClaimPanel({ proofs, claimed, onClaimSuccess }: ClaimPanelProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const [txState, setTxState] = useState<ClaimTxState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess && txState === 'pending') {
      setTxState('confirmed')
      onClaimSuccess?.()
    }
  }, [isSuccess, txState, onClaimSuccess])

  const medallionsAddress = getMedallionsAddress(BASE_CHAIN_ID)

  const unclaimedEligible = Object.entries(proofs)
    .filter(([yearIdStr, p]) => {
      const yearId = Number(yearIdStr)
      const claimedCount = claimed[yearId] ?? 0
      return p.count > 0 && claimedCount < p.count
    })
    .map(([y, p]) => ({ yearId: Number(y), count: p.count, proof: p.proof }))

  const totalMedallions = unclaimedEligible.reduce((acc, x) => acc + x.count, 0)
  const yearCount = unclaimedEligible.length

  const handleClaimAll = async () => {
    if (!address || !medallionsAddress || unclaimedEligible.length === 0) {
      setErrorMessage('Nothing to claim or wallet not connected.')
      setTxState('error')
      return
    }
    if (chainId !== BASE_CHAIN_ID) {
      try {
        await switchChainAsync?.({ chainId: BASE_CHAIN_ID })
      } catch (e) {
        setErrorMessage('Please switch to Base network.')
        setTxState('error')
        return
      }
    }

    setErrorMessage(null)
    setTxState('pending')
    try {
      const yearIds = unclaimedEligible.map((e) => BigInt(e.yearId))
      const counts = unclaimedEligible.map((e) => BigInt(e.count))
      const proofsBatch = unclaimedEligible.map((e) => e.proof as `0x${string}`[])

      writeContract(
        {
          address: medallionsAddress,
          abi: MEDALLIONS_ABI,
          functionName: 'claimBatch',
          args: [yearIds, counts, proofsBatch],
        },
        {
          onError: (err) => {
            setErrorMessage(err.message ?? 'Transaction failed.')
            setTxState('error')
          },
        }
      )
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Failed to send transaction.')
      setTxState('error')
    }
  }

  if (yearCount === 0 && txState !== 'confirmed') {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center text-muted-foreground">
        You have no medallions left to claim for this wallet.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-card p-6 space-y-4">
      <p className="text-sm text-foreground">
        You are eligible to claim <strong>{totalMedallions}</strong> medallion
        {totalMedallions !== 1 ? 's' : ''} across <strong>{yearCount}</strong> year
        {yearCount !== 1 ? 's' : ''}.
      </p>
      <button
        type="button"
        onClick={handleClaimAll}
        disabled={!address || !medallionsAddress || txState === 'pending' || yearCount === 0}
        className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {txState === 'pending' ? 'Confirming...' : txState === 'confirmed' ? 'Claimed' : 'Claim All'}
      </button>
      {txState === 'error' && errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
      {chainId !== BASE_CHAIN_ID && (
        <p className="text-sm text-amber-600">Switch to Base to claim.</p>
      )}
    </div>
  )
}
