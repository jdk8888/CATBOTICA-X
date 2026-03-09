# CATBOTICA — Roadmap to Live Mint on Base

**Goal:** Go live with a secure, end-to-end mint on Base (chainId 8453): user claims → backend validates → backend mints ERC-1155 badge + SBT on Base.

**Lore Anchor:** CAT-EVENT-LMRP-2026-HORSE | **Chain:** Base (8453)

---

## How Far Away Are You?

| Layer | Status | What’s missing |
|-------|--------|----------------|
| **Frontend** | ✅ ~90% | Wallet + form + eligibility UI done. Add: require Base (8453) before submit, show tx link after mint. |
| **Claim API** | ⚠️ ~70% | Validation + signature + rate limit done. Missing: **on-chain mint step**, **persistent DB**. |
| **Smart contracts** | ✅ Ready | ERC-1155 + SBT written, Hardhat has Base. **Not yet deployed** to Base; addresses still `0x0`. |
| **Security** | ⚠️ Partial | Sig + replay + rate limit in place. Missing: **server-only minter key**, **simulate-before-mint**, **persistent duplicate check**. |

**Rough distance to “go live and generate a mint”:** about **4–6 focused steps** (contract deploy → metadata → claim-service backend → DB → wire API to mint → frontend chain + feedback).

---

## Security Principles (Non-Negotiable)

1. **No private keys in frontend.** Mint is done only by the backend using a dedicated **claim-service wallet** (env var, e.g. `CLAIM_SERVICE_PRIVATE_KEY` in Vercel, never `NEXT_PUBLIC_*`).
2. **Simulate before mint.** Backend calls `eth_call` (or equivalent) for `mintBadge` / `issueProof` before sending the real transaction to avoid reverts and wasted gas.
3. **No infinite approvals.** Not applicable here (no ERC-20 approve); keep this rule for any future token approvals.
4. **Chain safety.** Frontend must ensure user is on Base (8453) before submit; reject or prompt switch if not.
5. **Replay + signature.** Already in place: 5-minute timestamp window + `verifyMessage`; keep it.
6. **Rate limiting.** Already in place (e.g. 5 req/min per IP); keep it.
7. **Address validation.** Contract addresses in app must come from env or a known registry (no user-supplied contract addresses for mint).

---

## Roadmap: Next Steps (Ordered)

### Phase 1 — Contracts on Base

| Step | Action | Security / notes |
|------|--------|------------------|
| 1.1 | **Deploy to Base Sepolia first** (recommended). In `projects/CATBOTICA/web3/contracts`: set `.env` with `DEPLOYER_PRIVATE_KEY`, `BASE_SEPOLIA_RPC_URL`, `TREASURY_WALLET_ADDRESS`, `ERC1155_BASE_URI`, `SBT_BASE_URI` (can use placeholders for first deploy). Run: `npx hardhat run scripts/deploy-all.ts --network baseSepolia`. | Use a dedicated deployer wallet; never use a wallet that holds significant mainnet funds. |
| 1.2 | **Create claim-service wallet.** New wallet used only for minting (e.g. MetaMask or script). Fund it with a small amount of ETH on Base Sepolia (then Base mainnet). Set `CLAIM_SERVICE_WALLET` in `.env` and re-run deploy to grant `MINTER_ROLE` to this wallet (or run a small script that only grants the role). | Never use the deployer as the long-term minter; use a separate claim-service wallet. |
| 1.3 | **Deploy to Base mainnet** when ready. Same as 1.1 but `--network base`. Then grant `MINTER_ROLE` to `CLAIM_SERVICE_WALLET` on mainnet. | Double-check treasury, royalty, and URIs; mainnet is irreversible. |
| 1.4 | **Upload metadata to IPFS** (Pinata, NFT.Storage, or similar). Prepare JSON for badges + SBT per tokenId. Update `ERC1155_BASE_URI` and `SBT_BASE_URI` (or call `setBaseURI` on contracts if supported). Verify `uri(tokenId)` returns correct JSON. | Ensures badges and SBT display correctly in wallets and marketplaces. |
| 1.5 | **Verify contracts on Basescan.** Use Hardhat verify with the deploy script’s suggested commands so Base (and Base Sepolia) show verified source. | Improves trust and debugging. |

### Phase 2 — Backend: Persistent DB + Mint Step

| Step | Action | Security / notes |
|------|--------|------------------|
| 2.1 | **Replace in-memory claim store with a database.** Use Supabase (PostgreSQL) or similar. Tables: e.g. `claims` (claimId, walletAddress, socialPlatform, socialUserId, event, status, txHash, createdAt). Env: `DATABASE_URL` or Supabase keys in Vercel (server-only). | Prevents duplicate claims across restarts and serverless instances; required for Gate 3 and audit trail. |
| 2.2 | **Add CLAIM_SERVICE_PRIVATE_KEY to Vercel** (Environment Variables). Only for server-side; never expose as `NEXT_PUBLIC_*`. Use a dedicated claim-service wallet with MINTER_ROLE. | Key must be server-only and not logged. |
| 2.3 | **Implement mint step in `/api/claim`.** After validation and DB insert (status e.g. `pending_mint`): (1) Build tx for `badges.mintBadge(to, tokenId, claimId)` and `sbt.issueProof(to, tokenId, claimId)` on Base. (2) **Simulate** with `eth_call` (or viem `simulateContract`). (3) If simulation succeeds, send transaction with claim-service wallet. (4) Store `txHash` and set status to `minted` (or `failed` on error). Use chainId 8453 and RPC from env (e.g. `BASE_RPC_URL`). | Simulation reduces failed txs and improves reliability. |
| 2.4 | **Load contract addresses from env.** In `lib/contracts.ts` (or a small server-only module), read `NEXT_PUBLIC_BASE_ERC1155_ADDRESS` and `NEXT_PUBLIC_BASE_SBT_ADDRESS` for chainId 8453 so the app and API use the deployed addresses. Optionally support Base Sepolia (84532) via env for staging. | Ensures backend and frontend use the same verified contracts. |

### Phase 3 — Frontend & Production Hardening

| Step | Action | Security / notes |
|------|--------|------------------|
| 3.1 | **Require Base (8453) before submit.** In `LunarClaimForm`, before calling `/api/claim`: check `chainId === 8453` (wagmi). If not, prompt user to switch network (e.g. `switchChain({ chainId: 8453 })`) and disable submit until on Base. | Prevents claims submitted for wrong chain and confusion. |
| 3.2 | **Show success + tx link.** After API returns success and `txHash`, show Basescan link (e.g. `https://basescan.org/tx/${txHash}`) and optional “View badge” (e.g. Basescan token page). | Clear feedback and verifiable on-chain result. |
| 3.3 | **Vercel env checklist.** Set in project: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_BASE_ERC1155_ADDRESS`, `NEXT_PUBLIC_BASE_SBT_ADDRESS`, `CLAIM_SERVICE_PRIVATE_KEY`, `BASE_RPC_URL`, `DATABASE_URL` (or Supabase). Optional: `CATBOTICA_NFT_CONTRACT_ADDRESS`, `CATBOTICA_NFT_CHAIN_ID`, `ENFORCE_NFT_GATE`, `ENFORCE_SOCIAL_GATE` for eligibility. | No keys in frontend; only public addresses and RPC. |
| 3.4 | **Optional: CORS and rate limit.** Ensure API route allows only your frontend origin(s). Rate limit already present; tune if needed (e.g. per wallet in addition to per IP). | Reduces abuse and cross-origin misuse. |

### Phase 4 — Go-Live Checklist

- [ ] Contracts deployed on Base (8453); addresses in env and `lib/contracts.ts`.
- [ ] MINTER_ROLE granted only to claim-service wallet; deployer key not used in production for minting.
- [ ] Claim-service wallet funded with a small amount of ETH on Base for gas.
- [ ] Metadata on IPFS; `uri(tokenId)` correct for badge and SBT.
- [ ] DB stores claims and duplicate check uses DB (no in-memory only).
- [ ] `/api/claim` verifies signature, timestamp, three gates, then simulates then mints; stores txHash and status.
- [ ] Frontend forces Base (8453) before submit and shows Basescan link on success.
- [ ] No `CLAIM_SERVICE_PRIVATE_KEY` or any secret in frontend or `NEXT_PUBLIC_*`.
- [ ] Optional: short internal “runbook” (who can fund claim-service wallet, how to pause by revoking MINTER_ROLE if needed).

---

## Quick Reference: Key Files

| Purpose | Path |
|---------|------|
| Claim API (add mint step + DB here) | `app/api/claim/route.ts` |
| Contract addresses (update from env after deploy) | `lib/contracts.ts` |
| Eligibility + Gate 2/3 (uses contract addresses) | `lib/claim-validator.ts` |
| Deploy ERC-1155 + SBT to Base | `web3/contracts/scripts/deploy-all.ts` |
| Hardhat Base config | `web3/contracts/hardhat.config.ts` |
| Frontend form + submit | `app/components/LunarClaimForm.tsx` |
| Wagmi/Web3 config (Base already in chains) | `app/providers.tsx` |

---

## Summary

You are roughly **4–6 steps** from a live, secure mint on Base: deploy contracts → set metadata → add DB and claim-service mint in the API → wire env and addresses → enforce Base and show tx link in the UI. Security is mostly about keeping the minter key server-only, simulating before mint, and persisting claims in a DB for duplicate checks and auditability.

---

## Time to Complete

| Scenario | Estimate |
|----------|----------|
| **Focused (full-time, familiar with stack)** | **3–5 days** — Deploy day 1; DB + API mint day 2; frontend + env day 3; test on Base Sepolia + mainnet + go-live day 4–5. |
| **Part-time or first time** | **1–2 weeks** — Same steps with buffer for IPFS metadata, Supabase setup, and testing. |
| **Per phase** | Phase 1 (contracts + metadata): 1–2 days. Phase 2 (DB + mint API): 1–2 days. Phase 3 (frontend + go-live): 0.5–1 day. |

Assumes one developer; no external audit. Add 1–2 weeks if you want a third-party smart-contract audit before mainnet.

---

## Costs (Mint, Claim, and Going Live)

All figures are approximate. **Base (L2) is very cheap**; most cost is one-time setup and funding the claim-service wallet.

### One-time / setup

| Item | Cost |
|------|------|
| **Deploy 2 contracts to Base** | **~$0.50–2** total. Base gas is low (~0.002 gwei min); deploy is a few million gas across both contracts. |
| **Deploy to Base Sepolia** | **Free** (testnet ETH from faucet). |
| **Basescan contract verification** | **Free.** |
| **IPFS metadata** | **Free** (Pinata/NFT.Storage free tier) or **~$5–20/mo** if you need paid pinning. |
| **Supabase (DB)** | **Free** tier is enough for thousands of claims. |
| **Vercel** | **Free** tier is enough for the claim app. |
| **WalletConnect** | **Free** (cloud.walletconnect.com). |

### Per claim / per mint (ongoing)

| Item | Cost | Who pays |
|------|------|----------|
| **Gas per claim (2 txs on Base)** | **~$0.001–0.01** per claim. Two txs: ERC-1155 `mintBadge` + SBT `issueProof`. Base is L2; at typical fees, 200k–300k gas total ≈ well under $0.01. | **You** (claim-service wallet). |
| **User (claimer)** | **$0** — Claim is free; user only signs a message (no gas). | User pays nothing. |

### Claim-service wallet (you fund once)

| Item | Recommendation |
|------|-----------------|
| **Fund with ETH on Base** | **~$5–20** is enough for **hundreds to thousands** of claims at current Base prices. Top up when low. |

### Summary table

| Category | One-time | Per claim |
|----------|----------|-----------|
| **Blockchain (Base)** | ~$0.50–2 (deploy) | ~$0.001–0.01 (gas for 2 mints) |
| **Infra (IPFS, DB, Vercel)** | $0 (free tiers) | $0 |
| **User** | — | $0 |

**Total to go live:** about **$5–25** (deploy + fund claim-service wallet). **Ongoing:** a few cents per claim; scale by number of claims.

Last updated: 2026-02-16
