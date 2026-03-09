# CATBOTICA — Full test walkthrough (one script)

**Goal:** Deploy to Base Sepolia, fund the claim-service wallet, and run a test mint (badge + SBT) with placeholder metadata — all driven by one script with prompts.

**Lore Anchor:** CAT-EVENT-LMRP-2026-HORSE

---

## Prerequisites (one-time)

1. **Two wallets**
   - **Deployer** — used only to deploy contracts. Export its **private key**.
   - **Claim-service** — used only to call mint. Export its **address** and **private key**.

2. **Base Sepolia ETH**
   - Get testnet ETH from a faucet (e.g. [Coinbase Base Sepolia](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)).
   - You will need to fund **deployer** before the script deploys, and **claim-service** when the script asks (it will pause and show the address).

---

## Walkthrough: run the full test

### 1. Open PowerShell and go to the contracts folder

```powershell
cd E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web3\contracts
```

### 2. (First time only) Fund the deployer wallet

- Use the **deployer** address (the one whose private key you will enter).
- Send it a small amount of **Base Sepolia ETH** from the faucet above.

### 3. Run the full-test script

```powershell
.\scripts\run-full-test.ps1
```

### 4. What the script does (step by step)

| Step | What happens |
|------|----------------|
| **1. .env** | If `.env` is missing, it’s created from `.env.example`. You’re prompted for: **DEPLOYER_PRIVATE_KEY**, **TREASURY_WALLET_ADDRESS**, **CLAIM_SERVICE_WALLET** (address), **CLAIM_SERVICE_PRIVATE_KEY** (for test mint). Any value already in `.env` is kept. |
| **2. Compile** | Runs `npm run compile`. |
| **3. Deploy** | Runs Hardhat deploy to Base Sepolia (ERC-1155 + SBT, grant MINTER_ROLE to claim-service). **Deployer must have Base Sepolia ETH.** |
| **4. Pause** | Script prints the **claim-service** address and a faucet link, then: **“Press Enter when the wallet is funded.”** Go to the faucet, send Base Sepolia ETH to that address, then press Enter. |
| **5. Recipient** | You’re prompted for **RECIPIENT_ADDRESS** — the wallet that should receive the test badge (can be your own). |
| **6. Test mint** | Script runs `test-mint-sepolia.ts`: mints tokenId 5 (Horse) + SBT to the recipient. **Claim-service must have Base Sepolia ETH.** |
| **Done** | Script prints a Base Sepolia explorer link to view the recipient’s NFT transfers. |

### 5. Check the result

Open the printed link (e.g. `https://sepolia.basescan.org/address/0x.../nfttransfers`). You should see the ERC-1155 badge and the SBT. Metadata will be placeholder until you set real IPFS URIs.

---

## Optional: run with parameters

**Skip deploy** (contracts already deployed; only run test mint):

```powershell
.\scripts\run-full-test.ps1 -SkipDeploy
```

**Pass recipient and claim ID** (fewer prompts):

```powershell
.\scripts\run-full-test.ps1 -RecipientAddress "0xYourWallet" -ClaimId "LMRP-TEST-001"
```

**Use existing .env only** (no prompts; fails if something is missing):

```powershell
.\scripts\run-full-test.ps1 -NonInteractive -RecipientAddress "0xYourWallet"
```

---

## If something fails

- **“insufficient funds” on deploy** — Deployer has no Base Sepolia ETH. Fund it and run again (use `-SkipDeploy` if you already deployed).
- **“insufficient funds” on test mint** — Claim-service wallet has no Base Sepolia ETH. Fund the address shown at step 4, then press Enter again (or run `.\scripts\run-full-test.ps1 -SkipDeploy -RecipientAddress "0x..."`).
- **“CLAIM_SERVICE_PRIVATE_KEY not set”** — Add it to `.env` or run without `-NonInteractive` and enter it when prompted.
- **“No valid RECIPIENT_ADDRESS”** — You skipped the recipient prompt; run again and enter a 0x address, or use `-RecipientAddress "0x..."`.

---

## After the test

When badge art/metadata is finalized:

1. Upload metadata (and images) to IPFS.
2. Call `setBaseURI(newBaseURI)` on both contracts (as deployer or URI_SETTER_ROLE).
3. Deploy to **Base mainnet** when ready and point the claim app at mainnet (see LIVE_MINT_STEP_BY_STEP.md in the claimed app folder).
