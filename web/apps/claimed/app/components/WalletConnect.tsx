'use client'

import { useAccount, useDisconnect, useEnsName, useEnsAvatar } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { formatAddress } from '@/lib/utils'

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount()
  const { open } = useWeb3Modal()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName || undefined })

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 bg-background-light border border-secondary/20 rounded-lg px-4 py-2.5">
          {ensAvatar && (
            <img 
              src={ensAvatar} 
              alt="ENS Avatar" 
              className="w-8 h-8 rounded-full ring-2 ring-secondary/30"
            />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text">
              {ensName || formatAddress(address)}
            </span>
            {chain && (
              <span className="text-xs text-text-muted">
                {chain.name}
              </span>
            )}
          </div>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1" />
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2.5 text-sm font-medium text-text-muted hover:text-primary border border-background-lighter rounded-lg hover:border-primary/40 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => open()}
      className="px-8 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-text font-display font-bold rounded-xl hover:from-primary-light hover:to-primary transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40 relative overflow-hidden group"
    >
      <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
      Connect Wallet
    </button>
  )
}
