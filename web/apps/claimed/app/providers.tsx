'use client'

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, http, createConfig } from 'wagmi'
import { mainnet, polygon, base, arbitrum } from 'viem/chains'
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors'
import { useState, useEffect } from 'react'

// Get projectId from environment variable
// You'll need to get this from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'placeholder_dev_id'

// Configure chains & providers
const metadata = {
  name: 'CATBOTICA Lunar Fulfillment',
  description: 'Luck-Module Recalibration Protocol — Year of the Horse 2026',
  url: 'https://claimed.catbotica.com',
  icons: ['https://catbotica.com/favicon.ico']
}

// Create wagmi config
const config = createConfig({
  chains: [mainnet, polygon, base, arbitrum],
  connectors: [
    walletConnect({ projectId, metadata, showQrModal: false }),
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: metadata.name, appLogoUrl: metadata.icons[0] })
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http()
  }
})

// Initialize Web3Modal only on client side
let web3ModalInitialized = false
function initializeWeb3Modal() {
  if (web3ModalInitialized) return
  if (typeof window === 'undefined') return

  try {
    createWeb3Modal({
      wagmiConfig: config,
      projectId,
      enableAnalytics: false,
      enableOnramp: false,
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#C41E3A',
      }
    })
    web3ModalInitialized = true
  } catch (e) {
    console.warn('[Web3Provider] Web3Modal init skipped:', e)
  }
}

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    initializeWeb3Modal()
    setMounted(true)
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {mounted ? children : null}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
