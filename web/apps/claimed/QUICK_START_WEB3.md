# Quick Start: Get Web3 Working

## Minimum Setup (5 minutes)

### Step 1: Get WalletConnect Project ID

1. Go to https://cloud.walletconnect.com
2. Sign up (free)
3. Create a new project
4. Copy your **Project ID**

### Step 2: Create `.env.local`

Create a file named `.env.local` in the `claimed` folder:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=paste_your_project_id_here
```

### Step 3: Install & Run

```bash
cd E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web\apps\claimed
npm install
npm run dev
```

### Step 4: Test

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Select your wallet (MetaMask, etc.)
4. Approve connection
5. You should see your wallet address!

## What Works Immediately

✅ **Wallet Connection** - Works as soon as you add the Project ID
✅ **Message Signing** - Works immediately (no backend needed)
✅ **Form Validation** - All validation works

## What Needs Backend

⚠️ **Signature Verification** - Currently placeholder (needs backend)
⚠️ **NFT Verification** - Works if contract address is set
⚠️ **Claim Storage** - Needs database
⚠️ **Duplicate Prevention** - Needs database

## Optional: Add NFT Verification

If you want to verify NFT ownership before claiming, add to `.env.local`:

```bash
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0xYourContractAddress
NEXT_PUBLIC_NFT_STANDARD=ERC721
NEXT_PUBLIC_CHAIN_ID=1
```

## Testing Without Backend

The frontend works for testing without a backend:
- Wallet connection ✅
- Message signing ✅
- NFT verification ✅ (if contract set)
- Form submission ⚠️ (will show error until backend is set up)

## Next Steps

1. **Test locally** - Make sure wallet connection works
2. **Set up backend** - Implement signature verification (see `WEB3_SETUP_GUIDE.md`)
3. **Add database** - Store claims and prevent duplicates
4. **Deploy** - Set environment variables in production

## Troubleshooting

**"Wallet not connecting"**
- Check `.env.local` has the correct Project ID
- Make sure file is named exactly `.env.local` (not `.env`)
- Restart dev server after adding env file

**"Module not found"**
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then `npm install`

**"Signature not working"**
- This is expected until backend is set up
- Frontend signing works, but verification needs backend
