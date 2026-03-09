# CATBOTICA — Full test run: .env + deploy + pause to fund + test mint
# Lore Anchor: CAT-EVENT-LMRP-2026-HORSE
#
# Run from projects/CATBOTICA/web3/contracts:
#   .\scripts\run-full-test.ps1
#   .\scripts\run-full-test.ps1 -RecipientAddress "0xYourWallet"
#   .\scripts\run-full-test.ps1 -SkipDeploy   # already deployed, just run test mint
#
# What it does:
#   1. Ensure .env exists and has deployer key, treasury, claim-service address (prompts if missing)
#   2. Prompt for CLAIM_SERVICE_PRIVATE_KEY if not in .env (needed for test mint)
#   3. Compile
#   4. Deploy to Base Sepolia (unless -SkipDeploy)
#   5. Pause: "Fund claim-service wallet at 0x... with Base Sepolia ETH. Press Enter when done."
#   6. Run test-mint script (mintBadge + issueProof to -RecipientAddress)
#   7. Print Basescan link

param(
    [string]$RecipientAddress = "",   # wallet to receive test badge; prompt if empty
    [string]$ClaimId = "LMRP-TEST-001",
    [switch]$SkipDeploy,              # skip deploy step (use existing deployment)
    [switch]$NonInteractive           # use existing .env only; fail if anything missing
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ContractsRoot = Resolve-Path (Join-Path $ScriptDir "..")
$EnvPath = Join-Path $ContractsRoot ".env"
$ExamplePath = Join-Path $ContractsRoot ".env.example"
$ManifestPath = Join-Path $ContractsRoot "deployments\baseSepolia-84532.json"
$FaucetUrl = "https://www.coinbase.com/faucets/base-ethereum-goerli-faucet"

Push-Location $ContractsRoot

function Write-Step { param($Num, $Msg) Write-Host "`n[$Num] $Msg" -ForegroundColor Cyan }
function Write-Ok { param($Msg) Write-Host "  OK: $Msg" -ForegroundColor Green }
function Write-Warn { param($Msg) Write-Host "  >> $Msg" -ForegroundColor Yellow }
function Get-EnvValue($key) {
    $content = Get-Content $EnvPath -ErrorAction SilentlyContinue
    foreach ($line in $content) {
        if ($line -match "^$key=(.+)$") { return $matches[1].Trim() }
    }
    return ""
}

try {
    Write-Host "`n===============================================================" -ForegroundColor DarkCyan
    Write-Host "  CATBOTICA - Full test (Base Sepolia)" -ForegroundColor DarkCyan
    Write-Host "===============================================================`n" -ForegroundColor DarkCyan

    # ── Step 1: .env ──
    Write-Step 1 "Environment (.env)"
    if (-not (Test-Path $ExamplePath)) {
        Write-Host "  ERROR: .env.example not found." -ForegroundColor Red
        exit 1
    }
    if (-not (Test-Path $EnvPath)) {
        Copy-Item $ExamplePath $EnvPath
        Write-Ok ".env created from .env.example"
    } else {
        Write-Ok ".env exists"
    }

    if (-not $NonInteractive) {
        $envContent = Get-Content $EnvPath -Raw
        $needWrite = $false

        if ($envContent -notmatch 'DEPLOYER_PRIVATE_KEY=0x[a-fA-F0-9]{32,}') {
            $k = (Read-Host "  DEPLOYER_PRIVATE_KEY (0x...)").Trim()
            if ($k) { $envContent = $envContent -replace "DEPLOYER_PRIVATE_KEY=.*", "DEPLOYER_PRIVATE_KEY=$k"; $needWrite = $true }
        }
        if (-not ($envContent -match 'TREASURY_WALLET_ADDRESS=0x[a-fA-F0-9]{40}')) {
            $k = (Read-Host "  TREASURY_WALLET_ADDRESS").Trim()
            if ($k) { $envContent = $envContent -replace "TREASURY_WALLET_ADDRESS=.*", "TREASURY_WALLET_ADDRESS=$k"; $needWrite = $true }
        }
        if (-not ($envContent -match 'CLAIM_SERVICE_WALLET=0x[a-fA-F0-9]{40}')) {
            $k = (Read-Host '  CLAIM_SERVICE_WALLET (address)').Trim()
            if ($k) { $envContent = $envContent -replace "CLAIM_SERVICE_WALLET=.*", "CLAIM_SERVICE_WALLET=$k"; $needWrite = $true }
        }
        if ($envContent -notmatch 'CLAIM_SERVICE_PRIVATE_KEY=0x[a-fA-F0-9]{32,}') {
            $k = (Read-Host '  CLAIM_SERVICE_PRIVATE_KEY (0x...; for test mint)').Trim()
            if ($k) {
                if ($envContent -match "CLAIM_SERVICE_PRIVATE_KEY=") {
                    $envContent = $envContent -replace "CLAIM_SERVICE_PRIVATE_KEY=.*", "CLAIM_SERVICE_PRIVATE_KEY=$k"
                } else {
                    $envContent = $envContent.TrimEnd() + "`nCLAIM_SERVICE_PRIVATE_KEY=$k`n"
                }
                $needWrite = $true
            }
        }
        if ($needWrite) { Set-Content -Path $EnvPath -Value $envContent.TrimEnd() -NoNewline }
    }

    $envContent = Get-Content $EnvPath -Raw
    if ($envContent -notmatch 'DEPLOYER_PRIVATE_KEY=0x[a-fA-F0-9]{32,}') {
        Write-Warn "DEPLOYER_PRIVATE_KEY not set. Edit .env or run without -NonInteractive."
        exit 1
    }
    $claimAddr = Get-EnvValue "CLAIM_SERVICE_WALLET"
    if (-not $claimAddr -or $claimAddr.Length -lt 40) {
        Write-Warn "CLAIM_SERVICE_WALLET not set. Edit .env or run without -NonInteractive."
        exit 1
    }
    if ($envContent -notmatch 'CLAIM_SERVICE_PRIVATE_KEY=0x[a-fA-F0-9]{32,}') {
        Write-Warn "CLAIM_SERVICE_PRIVATE_KEY not set. Required for test mint. Edit .env or run without -NonInteractive."
        exit 1
    }

    # ── Step 2: Compile ──
    Write-Step 2 "Compile"
    npm run compile 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Ok "Compiled"

    # ── Step 3: Deploy (unless skip) ──
    if (-not $SkipDeploy) {
        Write-Step 3 "Deploy to Base Sepolia"
        npx hardhat run scripts/deploy-all.ts --network baseSepolia
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        Write-Ok "Deployed"
    } else {
        if (-not (Test-Path $ManifestPath)) {
            Write-Host "  ERROR: -SkipDeploy but no deployments/baseSepolia-84532.json. Deploy first." -ForegroundColor Red
            exit 1
        }
        Write-Step 3 "Deploy"
        Write-Ok "Skipped (using existing deployment)"
    }

    # ── Step 4: Pause to fund claim-service ──
    Write-Step 4 "Fund claim-service wallet"
    Write-Host "  Send Base Sepolia ETH to: " -NoNewline
    Write-Host $claimAddr -ForegroundColor Yellow
    Write-Host "  Faucet: $FaucetUrl" -ForegroundColor Gray
    if (-not $NonInteractive) {
        Read-Host "  Press Enter when the wallet is funded (then test mint will run)"
    } else {
        Write-Host "  (NonInteractive: continuing in 5s...)" -ForegroundColor Gray
        Start-Sleep -Seconds 5
    }

    # ── Step 5: Recipient for test mint ──
    $recipient = $RecipientAddress.Trim()
    if (-not $recipient -or $recipient.Length -lt 40) {
        $recipient = (Read-Host "  RECIPIENT_ADDRESS (wallet to receive test badge)").Trim()
    }
    if (-not $recipient -or $recipient.Length -lt 40) {
        Write-Warn "No valid RECIPIENT_ADDRESS. Run test mint manually: `$env:RECIPIENT_ADDRESS='0x...'; npx hardhat run scripts/test-mint-sepolia.ts --network baseSepolia"
        Pop-Location
        exit 0
    }

    # ── Step 5: Test mint ──
    Write-Step 5 "Test mint (badge + SBT to $recipient)"
    $env:RECIPIENT_ADDRESS = $recipient
    $env:CLAIM_ID = $ClaimId
    npx hardhat run scripts/test-mint-sepolia.ts --network baseSepolia
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Ok "Mint complete"

    Write-Host "`n===============================================================" -ForegroundColor DarkCyan
    Write-Host "  View NFT transfers:" -ForegroundColor Cyan
    Write-Host "  https://sepolia.basescan.org/address/$recipient#nfttransfers" -ForegroundColor White
    Write-Host "===============================================================`n" -ForegroundColor DarkCyan
}
finally {
    Pop-Location
}
