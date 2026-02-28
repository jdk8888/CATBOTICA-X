# Web3 Setup Guide - Wallet Connection & NFT Verification

This guide explains how to get wallet connection, signature verification, and NFT ownership confirmation working.

## Current Status

✅ **Already Built:**
- Wallet connection component (MetaMask, WalletConnect, Coinbase)
- Message signing functionality
- NFT verification logic (ERC-721 & ERC-1155)
- All integrated into the Next.js app

⚠️ **Needs Configuration:**
- WalletConnect Project ID
- NFT contract address (if verifying ownership)
- Backend API for signature verification

## Step-by-Step Setup

### 1. Get WalletConnect Project ID

1. Go to https://cloud.walletconnect.com
2. Sign up or log in
3. Click "Create New Project"
4. Enter project name: "CATBOTICA Claim"
5. Copy your **Project ID**

### 2. Set Up Environment Variables

Create a `.env.local` file in the `claimed` directory:

```bash
# Required: WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional: NFT Verification
# Only set these if you want to verify NFT ownership before claiming
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_NFT_TOKEN_ID=
NEXT_PUBLIC_NFT_STANDARD=ERC721
NEXT_PUBLIC_CHAIN_ID=1
```

**Chain IDs:**
- `1` = Ethereum Mainnet
- `137` = Polygon
- `8453` = Base
- `42161` = Arbitrum

### 3. Install Dependencies

```bash
cd E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web\apps\claimed
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## How It Works

### Wallet Connection Flow

1. **User clicks "Connect Wallet"**
   - Web3Modal opens with wallet options
   - User selects wallet (MetaMask, WalletConnect, etc.)
   - Wallet connects and address is displayed

2. **NFT Verification** (if configured)
   - Checks if wallet owns the NFT contract
   - Verifies on-chain ownership
   - Shows success/failure status

3. **Message Signing**
   - User signs a message to verify identity
   - Message includes timestamp and wallet address
   - Signature is stored for backend verification

4. **Form Submission**
   - All data sent to `/api/claim`
   - Includes: wallet address, signature, region, province (if Canadian)

## Backend Integration

### Current API Endpoint

The API route is at `app/api/claim/route.ts`. You need to implement:

1. **Signature Verification**
   ```typescript
   import { verifyMessage } from 'viem'
   
   const isValid = await verifyMessage({
     address: walletAddress,
     message: signedMessage,
     signature: signature
   })
   ```

2. **NFT Ownership Check** (if required)
   ```typescript
   // Already implemented in lib/nft-verification.ts
   const ownsNFT = await verifyERC721Ownership(
     contractAddress,
     walletAddress,
     tokenId,
     chainId
   )
   ```

3. **Database Storage**
   - Save claim data
   - Prevent duplicate claims
   - Store signature for audit trail

4. **Minting Process**
   - Trigger NFT minting
   - Update claim status
   - Send confirmation

### Example Backend Implementation

```typescript
// app/api/claim/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyMessage } from 'viem'
import { verifyERC721Ownership } from '@/lib/nft-verification'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, signature, signedMessage, region, province } = body

    // 1. Verify signature
    const isValid = await verifyMessage({
      address: walletAddress as `0x${string}`,
      message: signedMessage,
      signature: signature as `0x${string}`
    })

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // 2. Check NFT ownership (if required)
    if (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS) {
      const ownsNFT = await verifyERC721Ownership(
        process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as `0x${string}`,
        walletAddress as `0x${string}`,
        undefined,
        parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '1')
      )

      if (!ownsNFT) {
        return NextResponse.json(
          { error: 'NFT ownership verification failed' },
          { status: 403 }
        )
      }
    }

    // 3. Check for duplicate claims
    // const existingClaim = await db.claims.findUnique({
    //   where: { walletAddress }
    // })
    // if (existingClaim) {
    //   return NextResponse.json(
    //     { error: 'Already claimed' },
    //     { status: 409 }
    //   )
    // }

    // 4. Save to database
    // await db.claims.create({
    //   data: {
    //     walletAddress,
    //     signature,
    //     signedMessage,
    //     region,
    //     province,
    //     timestamp: new Date()
    //   }
    // })

    // 5. Trigger minting (if applicable)
    // await mintNFT(walletAddress)

    return NextResponse.json({
      success: true,
      message: 'Claim processed successfully',
      data: {
        walletAddress,
        region,
        province
      }
    })
  } catch (error) {
    console.error('Claim API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Testing Without Backend

The frontend works without a backend for testing:

1. **Wallet Connection** - Works immediately
2. **NFT Verification** - Works if contract address is set
3. **Message Signing** - Works immediately
4. **Form Submission** - Will show error (expected) until backend is set up

## Security Considerations

### Frontend (Already Implemented)
- ✅ Signature verification on backend (not just frontend)
- ✅ Message includes timestamp and address
- ✅ NFT ownership verified on-chain

### Backend (You Need to Implement)
- ⚠️ **Rate Limiting** - Prevent spam/abuse
- ⚠️ **Duplicate Prevention** - Check database before processing
- ⚠️ **Signature Verification** - Always verify on backend
- ⚠️ **Input Validation** - Validate all form data
- ⚠️ **CORS Configuration** - Restrict to your domain

## Deployment Checklist

### Before Going Live:

- [ ] Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in production environment
- [ ] Set NFT contract address (if using verification)
- [ ] Implement backend signature verification
- [ ] Set up database for claim storage
- [ ] Add rate limiting
- [ ] Add duplicate claim prevention
- [ ] Test on testnet first
- [ ] Set up error monitoring
- [ ] Configure CORS properly
- [ ] Add analytics tracking

## Troubleshooting

### Wallet Not Connecting
- Check `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set correctly
- Verify project ID is active at cloud.walletconnect.com
- Check browser console for errors
- Ensure wallet extension is installed and unlocked

### Signature Failing
- Check wallet is unlocked
- Verify network connection
- Check browser console for detailed errors
- Ensure message format is correct

### NFT Verification Failing
- Verify contract address is correct
- Check contract is on specified chain
- Ensure wallet owns the NFT
- Check token ID is correct (for ERC-1155)

### Build Errors
- Run `npm install` to ensure dependencies are installed
- Check TypeScript errors: `npm run lint`
- Verify all environment variables are set
- Clear `.next` folder and rebuild

## Next Steps

1. **Get WalletConnect Project ID** - Sign up at cloud.walletconnect.com
2. **Create `.env.local`** - Add your project ID
3. **Install dependencies** - Run `npm install`
4. **Test locally** - Run `npm run dev`
5. **Implement backend** - Add signature verification and database
6. **Deploy** - Set up production environment

## Need Help?

- **WalletConnect Docs**: https://docs.walletconnect.com
- **Wagmi Docs**: https://wagmi.sh
- **Viem Docs**: https://viem.sh
