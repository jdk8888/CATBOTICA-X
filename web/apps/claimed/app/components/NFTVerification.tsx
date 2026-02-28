'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { verifyERC721Ownership, verifyERC1155Ownership, verifyClaimEligibility } from '@/lib/nft-verification'
import type { Address } from 'viem'

interface NFTVerificationProps {
  contractAddress?: Address
  tokenId?: string
  standard?: 'ERC721' | 'ERC1155'
  chainId?: number
  onVerificationComplete: (isVerified: boolean) => void
}

export function NFTVerification({
  contractAddress,
  tokenId,
  standard = 'ERC721',
  chainId = 1,
  onVerificationComplete
}: NFTVerificationProps) {
  const { address } = useAccount()
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async () => {
    if (!address) {
      setError('Please connect your wallet first')
      return
    }

    if (!contractAddress) {
      // Use general eligibility check
      setIsVerifying(true)
      setError(null)
      try {
        const eligible = await verifyClaimEligibility(address, undefined, chainId)
        setIsVerified(eligible)
        onVerificationComplete(eligible)
      } catch (err) {
        setError('Verification failed. Please try again.')
        console.error('Verification error:', err)
      } finally {
        setIsVerifying(false)
      }
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      let verified = false

      if (standard === 'ERC721') {
        const tokenIdBigInt = tokenId ? BigInt(tokenId) : undefined
        verified = await verifyERC721Ownership(
          contractAddress,
          address,
          tokenIdBigInt,
          chainId
        )
      } else if (standard === 'ERC1155') {
        if (!tokenId) {
          throw new Error('Token ID required for ERC-1155 verification')
        }
        verified = await verifyERC1155Ownership(
          contractAddress,
          address,
          BigInt(tokenId),
          chainId
        )
      }

      setIsVerified(verified)
      onVerificationComplete(verified)
    } catch (err) {
      setError('Verification failed. Please try again.')
      console.error('Verification error:', err)
      setIsVerified(false)
      onVerificationComplete(false)
    } finally {
      setIsVerifying(false)
    }
  }

  if (isVerified === true) {
    return (
      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2 text-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Asset Verification Complete</span>
        </div>
        <p className="text-sm text-text-muted mt-2">
          Asset ownership has been verified. Your fulfillment request is eligible for processing.
        </p>
      </div>
    )
  }

  if (isVerified === false) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <div className="flex items-center gap-2 text-red-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="font-medium">Verification Failed</span>
        </div>
        <p className="text-sm text-text-muted mt-2">
          {error || 'This wallet does not own the required NFT or is not eligible to claim.'}
        </p>
        <button
          onClick={handleVerify}
          className="mt-3 px-4 py-2 text-sm bg-background-light border border-background-lighter rounded-lg hover:border-primary transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 bg-background-light border border-background-lighter rounded-lg">
      <h3 className="text-sm font-medium text-text mb-2">
        Asset Verification Required
      </h3>
      <p className="text-sm text-text-muted mb-4">
        {contractAddress 
          ? 'Per company policy, please verify ownership of the asset to proceed with fulfillment processing.'
          : 'Please verify your wallet eligibility for fulfillment submission.'}
      </p>
      {contractAddress && (
        <div className="p-3 bg-background rounded border border-background-lighter mb-4">
          <p className="text-xs text-text-muted font-mono break-words">
            Contract: {contractAddress}
          </p>
          {tokenId && (
            <p className="text-xs text-text-muted font-mono mt-1">
              Token ID: {tokenId}
            </p>
          )}
        </div>
      )}
      <button
        onClick={handleVerify}
        disabled={isVerifying || !address}
        className="w-full px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isVerifying ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verifying...
          </span>
        ) : (
          'Verify Asset Ownership'
        )}
      </button>
    </div>
  )
}
