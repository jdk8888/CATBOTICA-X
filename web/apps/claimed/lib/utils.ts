/**
 * Format Ethereum address to shortened version
 * @param address - Full Ethereum address
 * @param chars - Number of characters to show on each side
 * @returns Formatted address (e.g., "0x1234...5678")
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return ''
  if (address.length <= chars * 2 + 2) return address
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Validate Ethereum address format
 * @param address - Address to validate
 * @returns true if valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Convert hex string to readable format
 */
export function hexToString(hex: string): string {
  try {
    return Buffer.from(hex.slice(2), 'hex').toString('utf-8')
  } catch {
    return hex
  }
}
