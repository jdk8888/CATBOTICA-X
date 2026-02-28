# 🚀 START HERE - Get Web3 Working

## Quick Setup (3 Steps)

### 1️⃣ Get WalletConnect Project ID

1. Visit: **https://cloud.walletconnect.com**
2. Sign up (free account)
3. Click **"Create New Project"**
4. Name it: `CATBOTICA Claim`
5. **Copy your Project ID** (long string like: `a1b2c3d4e5f6...`)

### 2️⃣ Create `.env.local` File

**Option A: Use the setup script (Easiest)**
```powershell
cd E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web\apps\claimed
.\setup.ps1
```
Then edit `.env.local` and add your Project ID.

**Option B: Manual creation**
1. Navigate to: `E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web\apps\claimed\`
2. Create a new file named `.env.local`
3. Add this line (replace with your actual Project ID):
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=paste_your_project_id_here
   ```

**Windows Tip:** If you can't create a file starting with `.`:
- Open Notepad
- Type: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here`
- Save as: `.env.local` (put quotes around the filename: `".env.local"`)

### 3️⃣ Install & Run

```powershell
cd E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web\apps\claimed
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser!

## ✅ What Should Work

Once set up, you should be able to:
- ✅ Click "Connect Wallet" button
- ✅ See wallet selection modal
- ✅ Connect your MetaMask or other wallet
- ✅ See your wallet address displayed
- ✅ Sign messages with your wallet
- ✅ Verify NFT ownership (if contract address is set)

## 📋 Files Created

- `setup.ps1` - Automated setup script
- `SETUP_CHECKLIST.md` - Detailed checklist
- `WEB3_SETUP_GUIDE.md` - Complete guide
- `QUICK_START_WEB3.md` - Quick reference

## 🆘 Need Help?

**Wallet not connecting?**
- Check `.env.local` has the correct Project ID
- Make sure file is named exactly `.env.local`
- Restart dev server after creating/editing `.env.local`

**Installation errors?**
- Run: `npm install` again
- If that fails: Delete `node_modules` and `package-lock.json`, then `npm install`

**Still stuck?**
- Check `WEB3_SETUP_GUIDE.md` for detailed troubleshooting
- Check browser console (F12) for errors
