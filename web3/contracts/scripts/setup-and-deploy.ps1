# CATBOTICA — Setup .env and deploy to Base Sepolia (one script)
# Lore Anchor: CAT-EVENT-LMRP-2026-HORSE
#
# Run from repo root or from projects/CATBOTICA/web3/contracts:
#   .\scripts\setup-and-deploy.ps1
#   .\scripts\setup-and-deploy.ps1 -NonInteractive   # use existing .env, deploy only
#
# Step 1: Creates .env from .env.example (if missing) and prompts for required values.
# Step 2: Compiles and deploys ERC-1155 + SBT to Base Sepolia.
# Step 3: Prints env vars for the claimed app.

param(
    [switch]$NonInteractive,  # skip prompts; use existing .env
    [switch]$SkipDeploy,       # only setup .env, do not deploy
    [string]$Network = "baseSepolia"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ContractsRoot = Resolve-Path (Join-Path $ScriptDir "..")
$EnvPath = Join-Path $ContractsRoot ".env"
$ExamplePath = Join-Path $ContractsRoot ".env.example"

# ── Ensure we're in contracts folder ──
Push-Location $ContractsRoot

function Write-Step { param($Num, $Msg) Write-Host "`n[$Num] $Msg" -ForegroundColor Cyan }
function Write-Ok { param($Msg) Write-Host "  OK: $Msg" -ForegroundColor Green }
function Write-Warn { param($Msg) Write-Host "  >> $Msg" -ForegroundColor Yellow }

try {
    Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor DarkCyan
    Write-Host ('  CATBOTICA — Setup & Deploy (' + $Network + ')') -ForegroundColor DarkCyan
    Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor DarkCyan

    # ── Step 1: .env ──
    Write-Step 1 "Environment (.env)"

    if (-not (Test-Path $ExamplePath)) {
        Write-Host "  ERROR: .env.example not found at $ExamplePath" -ForegroundColor Red
        exit 1
    }

    $envContent = Get-Content $ExamplePath -Raw
    $needWrite = $false

    if (-not (Test-Path $EnvPath)) {
        Copy-Item $ExamplePath $EnvPath
        Write-Ok ".env created from .env.example"
        $envContent = Get-Content $EnvPath -Raw
        $needWrite = $true
    } else {
        Write-Ok ".env already exists"
    }

    if (-not $NonInteractive) {
        $deployerKey = (Read-Host "  DEPLOYER_PRIVATE_KEY (0x...)").Trim()
        if ($deployerKey) {
            $envContent = $envContent -replace "DEPLOYER_PRIVATE_KEY=.*", "DEPLOYER_PRIVATE_KEY=$deployerKey"
            $needWrite = $true
        }
        $treasury = (Read-Host "  TREASURY_WALLET_ADDRESS (receives royalties)").Trim()
        if ($treasury) {
            $envContent = $envContent -replace "TREASURY_WALLET_ADDRESS=.*", "TREASURY_WALLET_ADDRESS=$treasury"
            $needWrite = $true
        }
        $claimService = (Read-Host '  CLAIM_SERVICE_WALLET (address only; gets MINTER_ROLE)').Trim()
        if ($claimService) {
            $envContent = $envContent -replace "CLAIM_SERVICE_WALLET=.*", "CLAIM_SERVICE_WALLET=$claimService"
            $needWrite = $true
        }
        $basescan = (Read-Host '  BASESCAN_API_KEY (optional; for verify)').Trim()
        if ($basescan) {
            $envContent = $envContent -replace "BASESCAN_API_KEY=.*", "BASESCAN_API_KEY=$basescan"
            $needWrite = $true
        }
        if ($needWrite) {
            Set-Content -Path $EnvPath -Value $envContent.TrimEnd() -NoNewline
            $envContent = Get-Content $EnvPath -Raw
        }
    }

    # Quick check: deployer key set? (0x + at least 32 hex chars)
    if ($envContent -notmatch 'DEPLOYER_PRIVATE_KEY=0x[a-fA-F0-9]{32,}') {
        Write-Warn "DEPLOYER_PRIVATE_KEY does not look set. Edit .env and run again, or run with -NonInteractive after editing."
        if (-not $NonInteractive) { exit 1 }
    }

    if ($SkipDeploy) {
        Write-Host "`n  Skipping deploy (-SkipDeploy). .env is ready." -ForegroundColor Yellow
        Pop-Location
        exit 0
    }

    # ── Step 2: Compile ──
    Write-Step 2 "Compile"
    npm run compile
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Ok "Compiled"

    # ── Step 3: Deploy ──
    Write-Step 3 "Deploy to $Network"
    npx hardhat run scripts/deploy-all.ts --network $Network
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Ok "Deployed"

    # ── Step 4: Print claimed-app env ──
    Write-Step 4 "Env for claimed app (copy to .env.local or Vercel)"
    Write-Host ""
    npx hardhat run scripts/print-claimed-env.ts --network $Network
    Write-Host ""

    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor DarkCyan
    Write-Host "  Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Add CLAIM_SERVICE_PRIVATE_KEY to claimed app .env.local (server-only)." -ForegroundColor White
    Write-Host "  2. For Base Sepolia test: set NEXT_PUBLIC_BASE_SEPOLIA_ERC1155_ADDRESS and _SBT_ADDRESS in claimed app." -ForegroundColor White
    Write-Host "  3. Run in claimed app: npm run check-mint-env" -ForegroundColor White
    Write-Host "  4. Verify contracts (optional): use verify commands from deploy output." -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor DarkCyan
}
finally {
    Pop-Location
}
