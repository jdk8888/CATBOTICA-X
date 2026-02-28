# Quick Start - View the Claim Page

## Location
The claim page is located at:
```
projects/CATBOTICA/web/apps/claimed/
```

## To View It Locally

### Step 1: Navigate to the Project
```bash
cd projects/CATBOTICA/web/apps/claimed
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set Up Environment Variables
Create a `.env.local` file in the `claimed` directory with:
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

**To get a WalletConnect Project ID:**
1. Go to https://cloud.walletconnect.com
2. Sign up or log in
3. Create a new project
4. Copy your Project ID

### Step 4: Run the Development Server
```bash
npm run dev
```

### Step 5: Open in Browser
Open your browser and go to:
```
http://localhost:3000
```

## What You'll See

1. **Header**: "Claim Your CATBOTICA" title
2. **Wallet Connection Button**: Connect your Web3 wallet
3. **NFT Verification** (if configured): Verify NFT ownership
4. **Signature Request**: Sign a message to verify identity
5. **Claim Form**: 
   - Region dropdown
   - Terms of Service checkbox
   - Claim & Mint button

## Troubleshooting

### "Cannot find module" errors
Run `npm install` again to ensure all dependencies are installed.

### Wallet not connecting
- Make sure `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set in `.env.local`
- Check that your wallet extension is installed and unlocked

### Port 3000 already in use
The dev server will automatically use the next available port (3001, 3002, etc.)

## Full Path
```
E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web\apps\claimed\
```
