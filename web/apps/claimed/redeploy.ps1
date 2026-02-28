# ─────────────────────────────────────────────────────────────
# CATBOTICA — Quick Redeploy to Vercel
# Usage:  .\redeploy.ps1           (production)
#         .\redeploy.ps1 -Preview  (preview/staging URL)
# ─────────────────────────────────────────────────────────────

param(
    [switch]$Preview
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

$timestamp = Get-Date -Format "HH:mm:ss"

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Red
Write-Host "  CATBOTICA LMRP — Redeploy [$timestamp]"   -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════" -ForegroundColor Red
Write-Host ""

# ── Build check ──
Write-Host "[1/2] Building..." -ForegroundColor Cyan
$buildOutput = npx next build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Build failed:" -ForegroundColor Red
    Write-Host $buildOutput
    exit 1
}
Write-Host "  ✓ Build passed" -ForegroundColor Green

# ── Deploy ──
Write-Host ""
if ($Preview) {
    Write-Host "[2/2] Deploying preview..." -ForegroundColor Cyan
    npx vercel
    Write-Host ""
    Write-Host "  ✓ Preview deployed (unique URL above)" -ForegroundColor Green
    Write-Host "  Share with ?preview=true to bypass wallet gate" -ForegroundColor Yellow
} else {
    Write-Host "[2/2] Deploying to PRODUCTION..." -ForegroundColor Cyan
    npx vercel --prod
    Write-Host ""
    Write-Host "  ✓ Production updated" -ForegroundColor Green
}

Write-Host ""
Write-Host "  Done in $((Get-Date) - (Get-Date $timestamp)).TotalSeconds seconds" -ForegroundColor DarkGray -ErrorAction SilentlyContinue
Write-Host ""
