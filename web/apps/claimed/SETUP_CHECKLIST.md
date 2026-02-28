# Setup Checklist - Get Web3 Working

## ✅ Step-by-Step Checklist

### Step 1: Get WalletConnect Project ID
- [ ] Go to https://cloud.walletconnect.com
- [ ] Sign up or log in
- [ ] Click "Create New Project"
- [ ] Enter project name: "CATBOTICA Claim"
- [ ] Copy your Project ID (looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### Step 2: Create Environment File
- [ ] Navigate to: `E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web\apps\claimed\`
- [ ] Create a new file named `.env.local` (exactly this name, with the dot at the start)
- [ ] Add this line (replace with your actual Project ID):
  ```
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
  ```

**Windows Note:** If you can't create a file starting with a dot:
- Open Notepad
- Save as: `.env.local` (with quotes around the filename)
- Or use: `New-Item -Path ".env.local" -ItemType File` in PowerShell

### Step 3: Install Dependencies
- [ ] Open PowerShell or Terminal
- [ ] Navigate to the project:
  ```powershell
  cd E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web\apps\claimed
  ```
- [ ] Run:
  ```powershell
  npm install
  ```
- [ ] Wait for installation to complete (may take a few minutes)

### Step 4: Start Development Server
- [ ] Run:
  ```powershell
  npm run dev
  ```
- [ ] Wait for "Ready" message
- [ ] Note the URL (usually http://localhost:3000)

### Step 5: Test Wallet Connection
- [ ] Open http://localhost:3000 in your browser
- [ ] Click "Connect Wallet" button
- [ ] Select your wallet (MetaMask, WalletConnect, etc.)
- [ ] Approve the connection
- [ ] ✅ You should see your wallet address displayed!

## Troubleshooting

### "Cannot find module" errors
```powershell
# Delete and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### "WalletConnect Project ID is required"
- Check `.env.local` file exists
- Check it's in the `claimed` folder (not parent folder)
- Check the Project ID is correct (no extra spaces)
- Restart the dev server after creating/editing `.env.local`

### Port 3000 already in use
- The server will automatically use the next available port (3001, 3002, etc.)
- Check the terminal output for the actual URL

### Wallet not connecting
- Make sure you have a wallet extension installed (MetaMask, etc.)
- Make sure the wallet is unlocked
- Check browser console (F12) for errors
- Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set correctly

## What to Expect

### ✅ Working Correctly:
- "Connect Wallet" button appears
- Clicking it opens wallet selection modal
- After connecting, wallet address is displayed
- "Sign Message" button appears
- Can sign messages with wallet
- Form can be submitted

### ⚠️ Expected (Until Backend is Set Up):
- Form submission will show an error (this is normal)
- Backend needs to be implemented for actual claim processing
- See `WEB3_SETUP_GUIDE.md` for backend setup

## Next Steps After Setup

1. **Test wallet connection** - Make sure it works
2. **Test message signing** - Sign a test message
3. **Set up backend** - Implement API endpoint (see `WEB3_SETUP_GUIDE.md`)
4. **Add database** - Store claims
5. **Deploy** - Set up production environment

## Quick Commands Reference

```powershell
# Navigate to project
cd E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web\apps\claimed

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Check for errors
npm run lint
```
