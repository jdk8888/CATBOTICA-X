# CATBOTICA Claim Page - Setup Script
# Run this script to set up the project

Write-Host "=== CATBOTICA Claim Page Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the 'claimed' directory." -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Found package.json" -ForegroundColor Green

# Check for .env.local
if (Test-Path ".env.local") {
    Write-Host "✓ .env.local file exists" -ForegroundColor Green
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID") {
        Write-Host "✓ WalletConnect Project ID is set" -ForegroundColor Green
    } else {
        Write-Host "⚠ Warning: WalletConnect Project ID not found in .env.local" -ForegroundColor Yellow
        Write-Host "   Please add: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ .env.local file not found" -ForegroundColor Yellow
    Write-Host "   Creating template..." -ForegroundColor Yellow
    
    $envTemplate = @"
# WalletConnect Project ID
# Get your project ID from https://cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional: NFT Verification
# NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
# NEXT_PUBLIC_NFT_STANDARD=ERC721
# NEXT_PUBLIC_CHAIN_ID=1
"@
    
    $envTemplate | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✓ Created .env.local template" -ForegroundColor Green
    Write-Host "   ⚠ IMPORTANT: Edit .env.local and add your WalletConnect Project ID!" -ForegroundColor Yellow
}

# Check for node_modules
if (Test-Path "node_modules") {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠ Dependencies not installed" -ForegroundColor Yellow
    Write-Host "   Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env.local and add your WalletConnect Project ID" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "To get your WalletConnect Project ID:" -ForegroundColor Yellow
Write-Host "   Visit: https://cloud.walletconnect.com" -ForegroundColor White
Write-Host ""
