# CATBOTICA Claim Page

Claim and mint page for CATBOTICA NFTs at claimed.catbotica.com

## Features

- ✅ **Web3 Wallet Integration**
  - MetaMask, WalletConnect, Coinbase Wallet support
  - Multi-chain support (Ethereum, Polygon, Base, Arbitrum)
  - Wallet address display with ENS support

- ✅ **Message Signing**
  - SIWE (Sign-In with Ethereum) integration
  - User authentication via wallet signature
  - Timestamp and address verification

- ✅ **NFT Verification**
  - ERC-721 and ERC-1155 support
  - On-chain ownership verification
  - Optional requirement (can be skipped)

- ✅ **Claim Form**
  - Terms of Service agreement checkbox
  - Region selection dropdown (Asia, N America, S America, Europe, Africa)
  - Form validation
  - Loading states

- ✅ **Modern Design**
  - Dark theme with neon accents
  - Responsive design
  - TypeScript for type safety
  - Next.js 14 with App Router

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Required: WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional: NFT Verification
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_NFT_TOKEN_ID=
NEXT_PUBLIC_NFT_STANDARD=ERC721
NEXT_PUBLIC_CHAIN_ID=1
```

See `ENV_SETUP.md` for detailed instructions.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### WalletConnect Setup

1. Visit https://cloud.walletconnect.com
2. Create a new project
3. Copy your Project ID
4. Add it to `.env.local` as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

### NFT Verification (Optional)

If you want to require NFT ownership before claiming:

1. Set `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS` to your NFT contract
2. Set `NEXT_PUBLIC_NFT_STANDARD` to `ERC721` or `ERC1155`
3. Set `NEXT_PUBLIC_CHAIN_ID` to the chain where your NFT is deployed
4. Optionally set `NEXT_PUBLIC_NFT_TOKEN_ID` for specific token verification

If these variables are not set, NFT verification will be skipped.

## Customization

### Colors

Edit `tailwind.config.js` to match catbotica.com branding:

```javascript
colors: {
  primary: {
    DEFAULT: '#YOUR_COLOR',
    // ...
  }
}
```

### Fonts

Update `app/layout.tsx` to import and use your fonts:

```typescript
import { YourFont } from 'next/font/google'
```

### API Integration

The claim API route is at `app/api/claim/route.ts`. Implement your backend logic:

- Signature verification
- Database storage
- Minting process
- Duplicate claim prevention

## Project Structure

```
claimed/
├── app/
│   ├── api/
│   │   └── claim/
│   │       └── route.ts          # Claim API endpoint
│   ├── components/
│   │   ├── WalletConnect.tsx     # Wallet connection UI
│   │   ├── SignatureRequest.tsx  # Message signing component
│   │   └── NFTVerification.tsx   # NFT ownership verification
│   ├── providers.tsx              # Web3 providers setup
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main claim page
│   └── globals.css                # Global styles
├── lib/
│   ├── utils.ts                   # Utility functions
│   └── nft-verification.ts        # NFT verification logic
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## Web3 Features

### Supported Wallets

- MetaMask
- WalletConnect (mobile wallets)
- Coinbase Wallet
- Injected wallets (any browser extension)

### Supported Chains

- Ethereum Mainnet
- Polygon
- Base
- Arbitrum

### NFT Standards

- ERC-721 (Non-Fungible Tokens)
- ERC-1155 (Multi-Token Standard)

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables

Make sure to set all environment variables in your deployment platform (Vercel, Netlify, etc.).

## Next Steps

- [ ] Implement backend API for claim processing
- [ ] Add database integration
- [ ] Connect to smart contract for minting
- [ ] Add IPFS metadata handling
- [ ] Implement duplicate claim prevention
- [ ] Add success/confirmation page
- [ ] Customize colors/fonts to match catbotica.com
- [ ] Add analytics tracking

## Troubleshooting

### Wallet Not Connecting

- Make sure `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set correctly
- Check browser console for errors
- Ensure wallet extension is installed and unlocked

### NFT Verification Failing

- Verify contract address is correct
- Check that the contract is on the specified chain
- Ensure the wallet owns the NFT
- Check browser console for detailed error messages

### Build Errors

- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors: `npm run lint`
- Verify all environment variables are set

## Support

For issues or questions, contact: support@catbotica.com
