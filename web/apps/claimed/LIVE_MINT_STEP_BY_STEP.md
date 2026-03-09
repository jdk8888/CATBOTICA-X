# CATBOTICA Live Mint — Step-by-Step Guide

**Goal:** Deploy contracts on Base, configure the claim app, and run a full register → mint flow.  
**Lore Anchor:** CAT-EVENT-LMRP-2026-HORSE

Use this doc in order. Scripts are provided where possible; a few steps are manual (wallets, Vercel, IPFS).

---

## Prerequisites

- Node.js 18+
- A wallet you will use only as **deployer** (don’t use your main wallet)
- A separate wallet for **claim-service** (minting only; will hold MINTER_ROLE)
- [Basescan](https://basescan.org) account (free) for contract verification API key

**Optional one-shot script (Steps 2 + 3):** From `projects/CATBOTICA/web3/contracts` run:
```powershell
.\scripts\setup-and-deploy.ps1
```
This creates `.env` from `.env.example`, prompts for deployer key, treasury, claim-service address, and Basescan API key, then compiles and deploys to Base Sepolia and prints the claimed-app env. Use `-NonInteractive` to skip prompts (use existing `.env`) and `-SkipDeploy` to only setup `.env`.

---

## Step 1 — Create and fund wallets

### 1.1 Deployer wallet

- Create a new wallet (e.g. MetaMask, or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` + import).
- Export **private key** (e.g. `0x...`). You will put this in `.env` as `DEPLOYER_PRIVATE_KEY`.
- **Never commit or share this key.**

### 1.2 Claim-service wallet

- Create another new wallet (used only for calling `mintBadge` and `issueProof`).
- Export its **address** and **private key**.
- You will set:
  - `CLAIM_SERVICE_WALLET` = address (in web3 contracts `.env`)
  - `CLAIM_SERVICE_PRIVATE_KEY` = private key (in Vercel / claimed app `.env.local`, **server-only**).

### 1.3 Get testnet ETH (Base Sepolia)

- Base Sepolia faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet (or search “Base Sepolia faucet”).
- Send testnet ETH to **both** deployer and claim-service addresses so they can pay gas.

---

## Step 2 — Configure web3 contracts `.env`

**Path:** `E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web3\contracts\`

1. Copy the example env file:
   ```powershell
   cd E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web3\contracts
   copy .env.example .env
   ```

2. Edit `.env` and set at least:

   | Variable | What to set |
   |----------|-------------|
   | `DEPLOYER_PRIVATE_KEY` | Deployer wallet private key (`0x...`) |
   | `TREASURY_WALLET_ADDRESS` | Wallet that will receive royalties (can be deployer or another address) |
   | `CLAIM_SERVICE_WALLET` | Claim-service wallet **address** (so deploy script can grant MINTER_ROLE) |
   | `BASE_SEPOLIA_RPC_URL` | `https://sepolia.base.org` or your own RPC |
   | `BASESCAN_API_KEY` | From https://basescan.org/myapikey (for contract verification) |

   Leave URIs as placeholders for now:  
   `ERC1155_BASE_URI=ipfs://PLACEHOLDER/`, `SBT_BASE_URI=ipfs://PLACEHOLDER_SBT/`

3. Save and close. **Do not commit `.env`.**

---

## Step 3 — Deploy to Base Sepolia (testnet)

**Path:** `projects\CATBOTICA\web3\contracts`

1. Install deps and compile (if not already):
   ```powershell
   cd E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web3\contracts
   npm install
   npx hardhat compile
   ```

2. Deploy both contracts and grant MINTER_ROLE to claim-service:
   ```powershell
   npx hardhat run scripts/deploy-all.ts --network baseSepolia
   ```

3. Copy the printed contract addresses. The script also writes:
   `deployments/baseSepolia-84532.json`

4. If you did **not** set `CLAIM_SERVICE_WALLET` before deploy, grant the role now:
   ```powershell
   # Set CLAIM_SERVICE_WALLET in .env, then:
   npx hardhat run scripts/grant-minter-role.ts --network baseSepolia
   ```

---

## Step 4 — Print env for the claimed app (Base Sepolia)

From the same contracts folder:

```powershell
npx hardhat run scripts/print-claimed-env.ts --network baseSepolia
```

Copy the printed lines into the **claimed app** `.env.local` (see Step 5).  
For Base Sepolia you will use `NEXT_PUBLIC_BASE_SEPOLIA_ERC1155_ADDRESS` and `NEXT_PUBLIC_BASE_SEPOLIA_SBT_ADDRESS`; the claimed app’s `lib/contracts.ts` reads those for chainId 84532.

**Note:** The claimed app today only uses Base mainnet (8453) for mint. To test on Base Sepolia you’d temporarily point the app at 84532 (or add a “testnet mode”). For the step-by-step we’ll deploy to Base mainnet next and use that for the final env.

---

## Step 5 — Configure claimed app `.env.local` (for Base mainnet later)

**Path:** `E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web\apps\claimed\`

1. Create or edit `.env.local` in the **claimed** app folder.

2. Add (get values from Step 7 after mainnet deploy, or from Step 4 for Sepolia test):

   ```env
   NEXT_PUBLIC_BASE_ERC1155_ADDRESS=0x...   # From deploy output or print-claimed-env
   NEXT_PUBLIC_BASE_SBT_ADDRESS=0x...
   BASE_RPC_URL=https://mainnet.base.org
   CLAIM_SERVICE_PRIVATE_KEY=0x...          # Claim-service wallet private key (server-only)
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=    # From WalletConnect Cloud
   ```

3. Run the env checker:
   ```powershell
   cd E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web\apps\claimed
   node scripts/check-mint-env.mjs
   ```
   Fix any missing vars until the script reports “Mint is configured.”

---

## Step 6 — Verify contracts on Basescan (Base Sepolia)

After deploy, the deploy script prints verify commands. Run them (replace `<net>` with `baseSepolia` and use the **exact** constructor args from the script output):

```powershell
npx hardhat verify --network baseSepolia <ERC1155_ADDRESS> "ipfs://PLACEHOLDER/" "ipfs://PLACEHOLDER_COLLECTION/" <TREASURY_ADDRESS> 750
npx hardhat verify --network baseSepolia <SBT_ADDRESS> "ipfs://PLACEHOLDER_SBT/" "ipfs://PLACEHOLDER_SBT_COLLECTION/"
```

Use the same order and values as in your deploy (check `deployments/baseSepolia-84532.json` for URIs and treasury).

---

## Step 7 — Deploy to Base mainnet

1. Fund the **deployer** and **claim-service** wallets with a small amount of real ETH on Base (e.g. bridge from Ethereum or buy on an exchange and withdraw to Base).

2. In `web3/contracts/.env`, ensure:
   - `BASE_RPC_URL` is set (e.g. `https://mainnet.base.org` or Alchemy/Infura).
   - `CLAIM_SERVICE_WALLET` is set so MINTER_ROLE is granted during deploy.

3. Deploy:
   ```powershell
   cd E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web3\contracts
   npx hardhat run scripts/deploy-all.ts --network base
   ```

4. Save the printed ERC-1155 and SBT addresses. Manifest is written to `deployments/base-8453.json`.

5. Print claimed-app env for mainnet:
   ```powershell
   npx hardhat run scripts/print-claimed-env.ts --network base
   ```
   Copy the output into the claimed app `.env.local` (overwrite or add the mainnet addresses).

6. Verify on Basescan (mainnet):
   ```powershell
   npx hardhat verify --network base <ERC1155_ADDRESS> "..." "..." <TREASURY> 750
   npx hardhat verify --network base <SBT_ADDRESS> "..." "..."
   ```

---

## Test mint before finalizing badges (placeholder metadata)

You can deploy and test the full mint flow **before** uploading final badge art/metadata. Contracts deploy with placeholder URIs (`ipfs://PLACEHOLDER/`); you can call `setBaseURI` later when metadata is ready.

**One script (recommended):** From `projects/CATBOTICA/web3/contracts` run:
```powershell
.\scripts\run-full-test.ps1
```
This walks you through: .env (prompts for deployer key, treasury, claim-service address and key), compile, deploy, **pause to fund claim-service**, then test mint to a recipient you specify. See `web3/contracts/scripts/RUN_FULL_TEST_WALKTHROUGH.md` for the full walkthrough.

**Manual flow (after deploying to Base Sepolia):**

1. Fund the **claim-service** wallet with a little Base Sepolia ETH (same faucet as deployer).
2. Run the test-mint script (mints tokenId 5 = Horse to a recipient):

   **PowerShell:**
   ```powershell
   cd E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web3\contracts
   $env:RECIPIENT_ADDRESS="0xYourWalletAddress"
   $env:CLAIM_ID="LMRP-TEST-001"
   npx hardhat run scripts/test-mint-sepolia.ts --network baseSepolia
   ```

3. Check the recipient wallet on [Base Sepolia explorer](https://sepolia.basescan.org) (NFT transfers). The badge and SBT will show with placeholder metadata until you set real IPFS URIs.

When badges are finalized: upload metadata to IPFS, then call `setBaseURI` on both contracts (or redeploy with real URIs) and proceed to Base mainnet.

---

## Step 8 — IPFS metadata (badge + SBT)

Contracts expect `uri(tokenId)` to resolve to JSON (e.g. `baseURI + tokenId + ".json"`). You can deploy with placeholder URIs and update later via `setBaseURI` (requires URI_SETTER_ROLE; deployer has DEFAULT_ADMIN so can grant that role).

1. Create one JSON file per token (e.g. `1.json` … `5.json` for Tiger–Horse) following [ERC-1155 metadata](https://eips.ethereum.org/EIPS/eip-1155#metadata).
2. Upload the folder to Pinata, NFT.Storage, or another IPFS pinning service.
3. Get the folder CID. Your base URI should be `ipfs://<CID>/` (trailing slash).
4. Call `setBaseURI(newBaseURI)` on both contracts (as deployer or an address with URI_SETTER_ROLE). If your contracts use a different role name, grant it from the admin wallet first.

---

## Step 9 — Set Vercel environment variables

1. Open your Vercel project (e.g. catbotica-fulfillment).
2. **Settings → Environment Variables.**
3. Add (for Production and Preview if you want):

   | Name | Value | Notes |
   |------|--------|--------|
   | `NEXT_PUBLIC_BASE_ERC1155_ADDRESS` | From Step 7 | Public |
   | `NEXT_PUBLIC_BASE_SBT_ADDRESS` | From Step 7 | Public |
   | `BASE_RPC_URL` | `https://mainnet.base.org` or your RPC | Secret |
   | `CLAIM_SERVICE_PRIVATE_KEY` | Claim-service private key | **Secret** |
   | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | From WalletConnect Cloud | Public |

4. Redeploy the app so the new env is applied.

---

## Step 10 — Test the full flow

1. Open the live app (e.g. https://catbotica-fulfillment.vercel.app).
2. Connect a wallet that holds a Catbotica NFT (or use eligibility logic you configured).
3. Switch network to **Base** (8453). The UI should show “Switch to Base” if you’re on another chain.
4. Fill the form and submit. Sign the message when prompted.
5. After success you should see a Basescan link; your wallet should show the ERC-1155 badge and SBT.

If the mint doesn’t run, run `node scripts/check-mint-env.mjs` locally with the same vars as Vercel to confirm they’re set. Check server logs for “[LMRP] Mint not executed” or “[mint-on-base]” errors.

---

## Scripts quick reference

| Script | Where | Purpose |
|--------|--------|--------|
| `.\scripts\setup-and-deploy.ps1` | web3/contracts | **One-shot:** create .env (prompts), compile, deploy to Base Sepolia, print claimed-app env. Use `-NonInteractive` to use existing .env; `-SkipDeploy` to only setup .env. |
| `npx hardhat run scripts/test-mint-sepolia.ts --network baseSepolia` | web3/contracts | Test mint: send badge + SBT to RECIPIENT_ADDRESS (env). Use before finalizing badge art. |
| `npx hardhat run scripts/deploy-all.ts --network baseSepolia` | web3/contracts | Deploy ERC-1155 + SBT and grant MINTER_ROLE (if CLAIM_SERVICE_WALLET set). |
| `npx hardhat run scripts/deploy-all.ts --network base` | web3/contracts | Same for Base mainnet. |
| `npx hardhat run scripts/grant-minter-role.ts --network base` | web3/contracts | Grant MINTER_ROLE to CLAIM_SERVICE_WALLET (if not done at deploy). |
| `npx hardhat run scripts/print-claimed-env.ts --network base` | web3/contracts | Print env vars for claimed app. |
| `node scripts/check-mint-env.mjs` | web/apps/claimed | Check that mint-related env vars are set. |

---

## Troubleshooting

- **“Mint not configured”**  
  Run `node scripts/check-mint-env.mjs` in the claimed app; add missing vars to `.env.local` or Vercel.

- **“Switch to Base was rejected”**  
  User must switch to Base (8453) in their wallet; submit is disabled until chainId is 8453.

- **Transaction reverted**  
  Ensure claim-service wallet has MINTER_ROLE on both contracts and has ETH for gas. Check duplicate claim (each wallet + claimId once).

- **Contract addresses 0x0**  
  Set `NEXT_PUBLIC_BASE_ERC1155_ADDRESS` and `NEXT_PUBLIC_BASE_SBT_ADDRESS` (and redeploy if on Vercel).

Last updated: 2026-02-16
