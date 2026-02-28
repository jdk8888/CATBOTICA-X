# ─────────────────────────────────────────────────────────────
# CATBOTICA — Lunar Fulfillment Page: First-Time Vercel Deploy
# Lore Anchor: CAT-EVENT-LMRP-2026-HORSE
#
# Usage:  .\deploy.ps1
# What:   Builds, verifies, and deploys to Vercel (first time)
# After:  Use .\redeploy.ps1 for subsequent updates
# ─────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host "  CATBOTICA — Luck-Module Recalibration Protocol"       -ForegroundColor Yellow
Write-Host "  Year of the Horse 2026 — Vercel Deployment"           -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host ""

Set-Location $ProjectRoot

# ── Step 1: Preflight checks ──
Write-Host "[1/6] Preflight checks..." -ForegroundColor Cyan

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "  ✓ npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ npm not found." -ForegroundColor Red
    exit 1
}

# Check .env.local
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "placeholder") {
        Write-Host "  ⚠ .env.local contains placeholder values." -ForegroundColor Yellow
        Write-Host "    WalletConnect may not work in production." -ForegroundColor Yellow
        Write-Host "    You'll need to set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID" -ForegroundColor Yellow
        Write-Host "    in the Vercel dashboard after deploy." -ForegroundColor Yellow
    } else {
        Write-Host "  ✓ .env.local found with real values" -ForegroundColor Green
    }
} else {
    Write-Host "  ⚠ No .env.local found. WalletConnect will need env vars in Vercel dashboard." -ForegroundColor Yellow
}

# ── Step 2: Install dependencies ──
Write-Host ""
Write-Host "[2/6] Installing dependencies..." -ForegroundColor Cyan
npm install --legacy-peer-deps 2>&1 | Out-Null
Write-Host "  ✓ Dependencies installed" -ForegroundColor Green

# ── Step 3: Build verification ──
Write-Host ""
Write-Host "[3/6] Building project (verification)..." -ForegroundColor Cyan
$buildOutput = npx next build 2>&1
$buildExitCode = $LASTEXITCODE

if ($buildExitCode -ne 0) {
    Write-Host "  ✗ Build failed!" -ForegroundColor Red
    Write-Host $buildOutput
    Write-Host ""
    Write-Host "  Fix the build errors above and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "  ✓ Build successful" -ForegroundColor Green

# ── Step 4: Vercel CLI check ──
Write-Host ""
Write-Host "[4/6] Checking Vercel CLI..." -ForegroundColor Cyan

$vercelInstalled = $false
try {
    $vercelVersion = npx vercel --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Vercel CLI available" -ForegroundColor Green
        $vercelInstalled = $true
    }
} catch {}

if (-not $vercelInstalled) {
    Write-Host "  Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel 2>&1 | Out-Null
    Write-Host "  ✓ Vercel CLI installed" -ForegroundColor Green
}

# ── Step 5: Vercel Login Check ──
Write-Host ""
Write-Host "[5/6] Vercel authentication..." -ForegroundColor Cyan
Write-Host ""
Write-Host "  If this is your first time, a browser window will open" -ForegroundColor Yellow
Write-Host "  to authenticate with Vercel. Follow the prompts." -ForegroundColor Yellow
Write-Host ""

# ── Step 6: Deploy ──
Write-Host "[6/6] Deploying to Vercel..." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Vercel will ask a few questions:" -ForegroundColor Yellow
Write-Host "  - Set up and deploy? → Y" -ForegroundColor Yellow
Write-Host "  - Which scope? → Select your account" -ForegroundColor Yellow
Write-Host "  - Link to existing project? → N (first time)" -ForegroundColor Yellow
Write-Host "  - Project name? → catbotica-lunar (or your preference)" -ForegroundColor Yellow
Write-Host "  - Directory? → ./ (press Enter)" -ForegroundColor Yellow
Write-Host "  - Override settings? → N" -ForegroundColor Yellow
Write-Host ""

# Deploy to production
npx vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "  IMPORTANT — Set environment variables in Vercel:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. Go to: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "  2. Select your project" -ForegroundColor White
    Write-Host "  3. Settings → Environment Variables" -ForegroundColor White
    Write-Host "  4. Add:" -ForegroundColor White
    Write-Host "     NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = 12167ae3ed229146043b8aa9188c13d2" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  5. Redeploy: .\redeploy.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "  Share the preview link with ?preview=true to show" -ForegroundColor Yellow
    Write-Host "  the full form without wallet connection." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  ✗ Deployment failed. Check errors above." -ForegroundColor Red
    Write-Host "  If auth failed, run: npx vercel login" -ForegroundColor Yellow
    exit 1
}
