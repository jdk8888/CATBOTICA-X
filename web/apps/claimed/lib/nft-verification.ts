import { createPublicClient, http, type Address, type Chain } from 'viem'
import { mainnet, polygon, base, arbitrum } from 'viem/chains'

// ERC-721 ABI for balanceOf and ownerOf
const ERC721_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ERC-1155 ABI for balanceOf
const ERC1155_ABI = [
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

/**
 * Get the appropriate chain client
 */
function getChainClient(chainId: number) {
  const chainMap: Record<number, Chain> = {
    1: mainnet,
    137: polygon,
    8453: base,
    42161: arbitrum,
  }

  const chain = chainMap[chainId] || mainnet
  return createPublicClient({
    chain,
    transport: http(),
  })
}

/**
 * Verify if a wallet owns an ERC-721 NFT
 * @param contractAddress - NFT contract address
 * @param walletAddress - Wallet address to check
 * @param tokenId - Optional token ID to verify specific ownership
 * @param chainId - Chain ID (1=mainnet, 137=polygon, etc.)
 * @returns Promise<boolean> - true if wallet owns the NFT
 */
export async function verifyERC721Ownership(
  contractAddress: Address,
  walletAddress: Address,
  tokenId?: bigint,
  chainId: number = 1
): Promise<boolean> {
  try {
    const client = getChainClient(chainId)

    if (tokenId !== undefined) {
      // Verify specific token ownership
      const owner = await client.readContract({
        address: contractAddress,
        abi: ERC721_ABI,
        functionName: 'ownerOf',
        args: [tokenId],
      })
      return owner.toLowerCase() === walletAddress.toLowerCase()
    } else {
      // Check if wallet has any balance
      const balance = await client.readContract({
        address: contractAddress,
        abi: ERC721_ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
      })
      return balance > 0n
    }
  } catch (error) {
    console.error('Error verifying ERC-721 ownership:', error)
    return false
  }
}

/**
 * Verify if a wallet owns an ERC-1155 NFT
 * @param contractAddress - NFT contract address
 * @param walletAddress - Wallet address to check
 * @param tokenId - Token ID to verify
 * @param chainId - Chain ID
 * @returns Promise<boolean> - true if wallet owns the NFT
 */
export async function verifyERC1155Ownership(
  contractAddress: Address,
  walletAddress: Address,
  tokenId: bigint,
  chainId: number = 1
): Promise<boolean> {
  try {
    const client = getChainClient(chainId)

    const balance = await client.readContract({
      address: contractAddress,
      abi: ERC1155_ABI,
      functionName: 'balanceOf',
      args: [walletAddress, tokenId],
    })

    return balance > 0n
  } catch (error) {
    console.error('Error verifying ERC-1155 ownership:', error)
    return false
  }
}

/**
 * Get NFT metadata from tokenURI
 * @param contractAddress - NFT contract address
 * @param tokenId - Token ID
 * @param chainId - Chain ID
 * @returns Promise with NFT metadata or null
 */
export async function getNFTMetadata(
  contractAddress: Address,
  tokenId: bigint,
  chainId: number = 1
): Promise<any | null> {
  try {
    const client = getChainClient(chainId)

    const tokenURI = await client.readContract({
      address: contractAddress,
      abi: ERC721_ABI,
      functionName: 'tokenURI',
      args: [tokenId],
    })

    // Handle IPFS URLs
    const url = tokenURI.startsWith('ipfs://')
      ? `https://ipfs.io/ipfs/${tokenURI.slice(7)}`
      : tokenURI

    const response = await fetch(url)
    if (!response.ok) return null

    return await response.json()
  } catch (error) {
    console.error('Error fetching NFT metadata:', error)
    return null
  }
}

/**
 * Verify wallet eligibility for claim
 * This is a placeholder - customize based on your requirements
 * @param walletAddress - Wallet address
 * @param contractAddress - Optional contract address to verify ownership
 * @param chainId - Chain ID
 * @returns Promise<boolean> - true if wallet is eligible
 */
export async function verifyClaimEligibility(
  walletAddress: Address,
  contractAddress?: Address,
  chainId: number = 1
): Promise<boolean> {
  // Example: Check if wallet owns a specific NFT
  if (contractAddress) {
    return await verifyERC721Ownership(contractAddress, walletAddress, undefined, chainId)
  }

  // Add other eligibility checks here:
  // - Whitelist verification
  // - Merkle tree verification
  // - API-based verification
  // etc.

  return true // Default to eligible if no specific checks
}
