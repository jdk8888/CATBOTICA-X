'use client'

import { useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { verifyMessage } from 'viem'

interface SignatureRequestProps {
  onSignatureComplete: (signature: string, message: string) => void
  message?: string
}

const DEFAULT_MESSAGE = 'I hereby submit this fulfillment request to CATBOTICA Inc. and acknowledge that I have read, understood, and agree to be bound by the Terms of Service and Privacy Policy.'

export function SignatureRequest({ 
  onSignatureComplete, 
  message = DEFAULT_MESSAGE
}: SignatureRequestProps) {
  const { address } = useAccount()
  const { signMessage, isPending, isSuccess, data: signature } = useSignMessage()
  const [hasSigned, setHasSigned] = useState(false)

  const handleSign = async () => {
    if (!address) return

    try {
      // Create a message with timestamp and address for uniqueness
      const timestamp = Date.now()
      const fullMessage = `${message}\n\nTimestamp: ${timestamp}\nAddress: ${address}`
      
      await signMessage({ 
        message: fullMessage 
      })
    } catch (error) {
      console.error('Signature error:', error)
    }
  }

  // Handle successful signature
  if (isSuccess && signature && !hasSigned) {
    setHasSigned(true)
    const timestamp = Date.now()
    const fullMessage = `${message}\n\nTimestamp: ${timestamp}\nAddress: ${address}`
    onSignatureComplete(signature, fullMessage)
  }

  if (hasSigned) {
    return (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2 text-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Authorization Complete</span>
        </div>
        <p className="text-sm text-text-muted mt-2">
          Your digital signature has been verified and recorded. Fulfillment request authorization approved.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-background-light border border-background-lighter rounded-lg">
      <h3 className="text-sm font-medium text-text mb-2">
        Digital Signature Required
      </h3>
      <p className="text-sm text-text-muted mb-4">
        Please provide your digital signature to authorize this claim submission. This signature serves as your acknowledgment and agreement to our terms of service.
      </p>
      <div className="p-3 bg-background rounded border border-background-lighter mb-4">
        <p className="text-xs text-text-muted font-mono break-words">
          {message}
        </p>
      </div>
      <button
        onClick={handleSign}
        disabled={isPending || !address}
        className="w-full px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Waiting for signature...
          </span>
        ) : (
          'Authorize & Sign'
        )}
      </button>
    </div>
  )
}
