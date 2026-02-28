# 🚀 Execute These Commands Now

## Copy & Paste These Commands

### Step 1: Navigate to Project
```powershell
cd "E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web\apps\claimed"
```

### Step 2: Create .env.local File
```powershell
# Create the file
New-Item -Path ".env.local" -ItemType File -Force

# Add the template (you'll need to edit it with your Project ID)
@"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
```

**Then edit `.env.local`** and replace `your_project_id_here` with your actual WalletConnect Project ID.

### Step 3: Install Dependencies
```powershell
npm install
```

### Step 4: Start Development Server
```powershell
npm run dev
```

### Step 5: Open in Browser
Open: **http://localhost:3000**

## Complete Command Sequence

Copy and paste this entire block:

```powershell
# Navigate to project
cd "E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web\apps\claimed"

# Create .env.local (you'll need to edit it)
if (-not (Test-Path ".env.local")) {
    @"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✓ Created .env.local - Please edit it and add your WalletConnect Project ID" -ForegroundColor Yellow
}

# Install dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
}

# Start dev server
Write-Host "Starting development server..." -ForegroundColor Cyan
Write-Host "Open http://localhost:3000 in your browser" -ForegroundColor Green
npm run dev
```

## Before Running: Get Your WalletConnect Project ID

1. **Visit:** https://cloud.walletconnect.com
2. **Sign up** (free)
3. **Create project** → Name: "CATBOTICA Claim"
4. **Copy Project ID**
5. **Edit `.env.local`** and paste your Project ID

## What Happens Next

1. ✅ Dependencies install
2. ✅ Dev server starts
3. ✅ Open http://localhost:3000
4. ✅ Click "Connect Wallet"
5. ✅ Select your wallet (MetaMask, etc.)
6. ✅ Wallet connects and address displays!

## Troubleshooting

**If npm install fails:**
```powershell
# Clear and reinstall
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
```

**If port 3000 is busy:**
- The server will automatically use port 3001, 3002, etc.
- Check the terminal output for the actual URL

**If wallet won't connect:**
- Make sure `.env.local` has your Project ID (not the placeholder)
- Restart the dev server after editing `.env.local`
- Check browser console (F12) for errors
