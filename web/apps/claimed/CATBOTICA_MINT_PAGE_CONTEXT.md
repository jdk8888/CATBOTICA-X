# CATBOTICA Mint Page — Context & Vercel Deploy

**Purpose:** Persistent context for the CATBOTICA mint/register/fulfillment flow. Use this doc to "bring back" the chat or onboard anyone working on the mint page.

**Lore Anchor:** CAT-EVENT-LMRP-2026-HORSE (Luck-Module Recalibration Protocol, Year of the Horse 2026)

---

## Live URLs (Vercel)

| Page | URL |
|------|-----|
| **Production** | **https://catbotica-fulfillment.vercel.app** |
| **Main app (register + mint)** | https://catbotica-fulfillment.vercel.app/ |
| **Static fulfillment page** | https://catbotica-fulfillment.vercel.app/fulfillment.html |
| **Preview mode (bypass wallet)** | https://catbotica-fulfillment.vercel.app/?preview=true |

---

## Status & Progress (confirmed)

**Done:**
- Next.js app deployed to Vercel (`catbotica-fulfillment.vercel.app`).
- Static fulfillment HTML available at `/fulfillment.html`.
- Wallet connection (WalletConnect), message signing, NFT verification logic, claim form (region, terms), and LunarClaimForm eligibility flow are built and in the codebase.
- Deploy scripts: `deploy.ps1` (first-time), `redeploy.ps1` (updates).
- Context doc and file map for chat continuity.

**Configured / to verify on Vercel:**
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — set in Vercel Dashboard → Project → Settings → Environment Variables so wallet connect works in production.

**Optional / next (from notes):**
- Backend API for claim processing (form submit currently may show error until backend is implemented; see `WEB3_SETUP_GUIDE.md`).
- NFT contract address and chain ID in env if you want on-chain NFT gating.
- Custom domain (e.g. `claimed.catbotica.com`) in Vercel if desired.

---

## What Lives Where

| Asset | Path | Purpose |
|-------|------|--------|
| **Next.js app (primary)** | `app/page.tsx` + `app/components/LunarClaimForm.tsx` | Full flow: connect wallet → eligibility check → **register/claim (mint)**. This is what runs at **/** on Vercel. |
| **Static fulfillment HTML** | `fulfillment.html` + `public/fulfillment.html` | Standalone "Fulfillment Center" page: connect wallet (mock), verify NFT (mock), sign message (mock), region form, submit. Served at **/fulfillment.html** when deployed. |
| **Deploy scripts** | `deploy.ps1` (first time), `redeploy.ps1` (updates) | Build Next.js and deploy to Vercel. |

---

## Register + Mint Flow (Summary)

1. **Register / Connect**  
   User connects wallet (WalletConnect in Next app; mock buttons in static HTML).

2. **Eligibility (Next app only)**  
   `LunarClaimForm` + `claim-validator.ts`: NFT holder check, mission-completer check, duplicate-claim check. If eligible → can proceed to mint.

3. **Mint / Claim**  
   Next app: API/contract call to mint badge or SBT. Static HTML: form submit is preview-only (no real mint).

---

## Bringing Back the “Latest” Page on Vercel

- **Primary (recommended):** Deploy the Next.js app so **/** is the live mint/register experience:
  ```powershell
  cd E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\web\apps\claimed
  .\redeploy.ps1
  ```
  Use `.\redeploy.ps1 -Preview` for a preview URL (e.g. share with `?preview=true` to bypass wallet gate).

- **Static HTML (fulfillment):** The latest fulfillment page is in `fulfillment.html`. A copy lives in `public/fulfillment.html` so that when you deploy the Next app to Vercel, **/fulfillment.html** is served automatically (register/fulfillment-style flow; mock wallet/NFT/sign; form submit is preview). To refresh: copy `fulfillment.html` → `public/fulfillment.html` before running `.\redeploy.ps1`.

- **First-time deploy:** Run `.\deploy.ps1`, then set in Vercel Dashboard → Settings → Environment Variables:
  - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (e.g. your WalletConnect project ID).

---

## Environment variables (live mint on Base)

For the **active airdrop** (ERC-1155 + SBT mint on Base after register):

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_BASE_ERC1155_ADDRESS` | Vercel / .env | CatboticaZodiacBadges contract on Base (8453). |
| `NEXT_PUBLIC_BASE_SBT_ADDRESS` | Vercel / .env | CatboticaSoulbound contract on Base (8453). |
| `CLAIM_SERVICE_PRIVATE_KEY` | Vercel / .env (server only) | Wallet with MINTER_ROLE; used to send mint + issueProof txs. Never expose in client. |
| `BASE_RPC_URL` | Vercel / .env (server only) | Base RPC (e.g. `https://mainnet.base.org` or Alchemy/Infura). |

If these are not set, the claim still succeeds but no on-chain mint runs (status `pending_mint`). Frontend requires wallet to be on Base (8453) before submit and shows a Basescan link when mint succeeds.

---

## File Map (Quick Reference)

- `app/page.tsx` — Root page: wallet gate + LunarClaimForm.
- `app/components/LunarClaimForm.tsx` — Main claim/mint form and eligibility.
- `app/components/WalletConnect.tsx` — Wallet connection UI.
- `lib/claim-validator.ts` — Eligibility logic (NFT, mission, duplicate).
- `lib/contracts.ts` — Contract addresses (env: `NEXT_PUBLIC_BASE_ERC1155_ADDRESS`, `NEXT_PUBLIC_BASE_SBT_ADDRESS`), ABIs, getContractAddresses.
- `lib/mint-on-base.ts` — Server-only: simulate + send ERC-1155 mintBadge + SBT issueProof on Base.
- `app/api/claim/route.ts` — POST: validate → store claim → mint on Base if configured; GET: claim status (incl. tx hashes).
- `fulfillment.html` — Standalone static fulfillment page (single file).
- `public/fulfillment.html` — Same page, served at `/fulfillment.html` on Vercel.
- `_deploy_fulfillment/index.html` — Legacy copy for static-only deploys.

---

## Chat Continuity

When someone says “CATBOTICA mint page” or “register and mint”:

- **Next app** = full register + mint (wallet, eligibility, real mint path).
- **Static HTML** = fulfillment/redemption-style form; mint is preview-only unless wired to an API.
- **Redeploy:** `.\redeploy.ps1` from `projects/CATBOTICA/web/apps/claimed`.

**Step-by-step live mint:** See **LIVE_MINT_STEP_BY_STEP.md** in this folder for a full walkthrough (wallets, deploy, env, verify, Vercel, test). Scripts: `web3/contracts/scripts/deploy-all.ts`, `grant-minter-role.ts`, `print-claimed-env.ts`; claimed app: `npm run check-mint-env`.

Last updated: 2026-02-16 — Live: https://catbotica-fulfillment.vercel.app
