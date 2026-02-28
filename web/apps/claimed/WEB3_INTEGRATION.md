# Web3 Integration Guide

## Overview

The CATBOTICA claim page now includes full Web3 functionality for wallet connection, message signing, and NFT verification.

## Components

### 1. Wallet Connection (`app/components/WalletConnect.tsx`)

**Features:**
- Supports MetaMask, WalletConnect, Coinbase Wallet, and injected wallets
- Displays connected wallet address with ENS name support
- Shows ENS avatar if available
- Displays current chain name
- Disconnect functionality

**Usage:**
```tsx
<WalletConnect />
```

### 2. Message Signing (`app/components/SignatureRequest.tsx`)

**Features:**
- SIWE (Sign-In with Ethereum) integration
- Creates unique messages with timestamp and wallet address
- Verifies user identity through wallet signature
- Shows success state after signing

**Props:**
- `onSignatureComplete`: Callback with signature and message
- `message`: Optional custom message (defaults to claim message)

**Usage:**
```tsx
<SignatureRequest 
  onSignatureComplete={(sig, msg) => {
    // Handle signature
  }}
/>
```

### 3. NFT Verification (`app/components/NFTVerification.tsx`)

**Features:**
- ERC-721 and ERC-1155 support
- On-chain ownership verification
- Optional verification (can be skipped)
- Shows verification status

**Props:**
- `contractAddress`: NFT contract address (optional)
- `tokenId`: Specific token ID (optional for ERC-721)
- `standard`: 'ERC721' or 'ERC1155'
- `chainId`: Chain ID where NFT is deployed
- `onVerificationComplete`: Callback with verification result

**Usage:**
```tsx
<NFTVerification
  contractAddress="0x..."
  tokenId="123"
  standard="ERC721"
  chainId={1}
  onVerificationComplete={(verified) => {
    // Handle verification
  }}
/>
```

## Utilities

### NFT Verification Library (`lib/nft-verification.ts`)

**Functions:**

1. **`verifyERC721Ownership`**
   - Verifies ERC-721 NFT ownership
   - Can check specific token or any balance
   ```typescript
   const owns = await verifyERC721Ownership(
     contractAddress,
     walletAddress,
     tokenId, // optional
     chainId
   )
   ```

2. **`verifyERC1155Ownership`**
   - Verifies ERC-1155 NFT ownership
   - Requires specific token ID
   ```typescript
   const owns = await verifyERC1155Ownership(
     contractAddress,
     walletAddress,
     tokenId,
     chainId
   )
   ```

3. **`verifyClaimEligibility`**
   - General eligibility check
   - Can include NFT ownership or other checks
   ```typescript
   const eligible = await verifyClaimEligibility(
     walletAddress,
     contractAddress, // optional
     chainId
   )
   ```

4. **`getNFTMetadata`**
   - Fetches NFT metadata from tokenURI
   - Handles IPFS URLs
   ```typescript
   const metadata = await getNFTMetadata(
     contractAddress,
     tokenId,
     chainId
   )
   ```

## Configuration

### Environment Variables

Set these in `.env.local`:

```bash
# Required
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Optional - NFT Verification
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_NFT_TOKEN_ID=123
NEXT_PUBLIC_NFT_STANDARD=ERC721
NEXT_PUBLIC_CHAIN_ID=1
```

### Supported Chains

- **Ethereum Mainnet**: Chain ID `1`
- **Polygon**: Chain ID `137`
- **Base**: Chain ID `8453`
- **Arbitrum**: Chain ID `42161`

## Claim Flow

1. **Connect Wallet**
   - User clicks "Connect Wallet"
   - Selects wallet from modal
   - Wallet address is displayed

2. **NFT Verification** (Optional)
   - If `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS` is set
   - Verifies wallet owns the NFT
   - Can be skipped if not required

3. **Message Signing**
   - User signs a message to verify identity
   - Message includes timestamp and address
   - Signature is stored for backend verification

4. **Form Completion**
   - User selects region
   - User accepts terms
   - Form validates all requirements

5. **Claim Submission**
   - All data sent to `/api/claim`
   - Includes: wallet, region, signature, verification status
   - Backend processes claim

## API Endpoint

### POST `/api/claim`

**Request Body:**
```json
{
  "walletAddress": "0x...",
  "region": "n-america",
  "termsAccepted": true,
  "signature": "0x...",
  "signedMessage": "...",
  "nftVerified": true,
  "timestamp": 1234567890
}
```

**Response:**
```json
{
  "success": true,
  "message": "Claim processed successfully",
  "data": {
    "walletAddress": "0x...",
    "region": "n-america",
    "timestamp": 1234567890
  }
}
```

## Security Considerations

1. **Signature Verification**
   - Always verify signatures on the backend
   - Use `viem` or `ethers` to verify message signatures
   - Check that signature matches wallet address

2. **Duplicate Claims**
   - Check database for existing claims by wallet address
   - Prevent multiple claims from same wallet

3. **Rate Limiting**
   - Implement rate limiting on API endpoint
   - Prevent spam/abuse

4. **NFT Verification**
   - Verify on-chain, not just in frontend
   - Check ownership at claim time, not just page load
   - Consider snapshot-based verification for gasless claims

## Customization

### Adding More Chains

Edit `app/providers.tsx`:

```typescript
import { optimism, zora } from 'viem/chains'

const config = createConfig({
  chains: [mainnet, polygon, base, arbitrum, optimism, zora],
  // ...
})
```

### Custom Message for Signing

Edit `app/components/SignatureRequest.tsx` or pass custom message:

```tsx
<SignatureRequest 
  message="Custom claim message here"
  onSignatureComplete={handleSignature}
/>
```

### Custom Eligibility Checks

Edit `lib/nft-verification.ts`:

```typescript
export async function verifyClaimEligibility(
  walletAddress: Address,
  contractAddress?: Address,
  chainId: number = 1
): Promise<boolean> {
  // Add your custom checks:
  // - Whitelist verification
  // - Merkle tree verification
  // - API-based verification
  // - Multiple NFT requirements
  // etc.
}
```

## Troubleshooting

### Wallet Not Connecting

- Check `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
- Verify project ID is correct at https://cloud.walletconnect.com
- Check browser console for errors
- Ensure wallet extension is installed

### Signature Failing

- Check wallet is unlocked
- Verify network connection
- Check browser console for detailed errors

### NFT Verification Failing

- Verify contract address is correct
- Check contract is on specified chain
- Ensure wallet owns the NFT
- Check token ID is correct (for ERC-1155)
- Verify contract implements standard ERC-721/ERC-1155

### Build Errors

- Run `npm install` to ensure dependencies are installed
- Check TypeScript errors: `npm run lint`
- Verify all environment variables are set
- Clear `.next` folder and rebuild

## Next Steps

1. **Backend Integration**
   - Implement signature verification
   - Add database for claim storage
   - Add duplicate claim prevention

2. **Smart Contract Integration**
   - Connect to minting contract
   - Implement gasless minting (if applicable)
   - Add transaction status tracking

3. **Enhanced Features**
   - Add claim history
   - Add transaction receipts
   - Add email notifications
   - Add analytics tracking
