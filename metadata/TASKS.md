# CATBOTICA — Task Queue
**Project:** CATBOTICA  
**Priority:** 2  
**Operator:** Updated by Cursor (Strategic Command) | Executed by Void  
**Log:** `projects/CATBOTICA/metadata/AGENT_LOG.md`

---

## HOW TO USE THIS FILE
- Void reads this file at the start of each session
- Complete tasks top-to-bottom within each day
- Mark completed: `- [x]` and add note in AGENT_LOG.md
- Flag blockers: `[BLOCKER]` in AGENT_LOG.md
- Flag decisions needed: `[DECISION_NEEDED]` in AGENT_LOG.md

---

## DAY 1 — Medallion Concept Brief
**Model:** `qwen3:30b`  
**Goal:** Define the New Year Medallion — meaning, rarity system, and 929er region mapping

- [ ] Read `projects/CATBOTICA/metadata/` for existing lore anchors and character data
- [ ] Read `01_Lore_Sanctum/projects/CATBOTICA/` for universe rules and 929er class system
- [ ] Generate `projects/CATBOTICA/metadata/medallion_concept_brief.md`:
  - Narrative meaning of the medallion (New Year ritual, region belonging)
  - Rarity tiers: 3–4 tiers (Common → Legendary)
  - How medallions map to the 929er class system (Loader, Mechanic, Builder, etc.)
  - Burn / hold mechanics: what does owning a medallion grant?
  - Visual style direction per tier
  - UUID lore anchors on each concept entry
- [ ] Log: `[DAY1_COMPLETE]` in AGENT_LOG.md

---

## DAY 2 — Region Registry Spec
**Model:** `qwen3:30b` (design) → `phi4:14b` (verification pass)  
**Goal:** Define the region system — regions, supply caps, burn/register mechanic

- [ ] Read `medallion_concept_brief.md` from Day 1
- [ ] Generate `projects/CATBOTICA/metadata/region_registry_spec.md`:
  - List all regions (suggest 8–12 regions, map to 929er classes)
  - Supply cap per region (creates scarcity, drives demand)
  - Registration mechanic: mint = register to region, immutable on-chain
  - Burn mechanic: optional — burn medallion to upgrade region status
  - Cross-IP: how regions tie into THEBEYONDVERSE ecosystem
  - Metadata schema for on-chain region attribute
- [ ] Run `phi4:14b` verification: check for lore inconsistencies vs existing CATBOTICA bible
- [ ] Generate `projects/CATBOTICA/metadata/region_registry_spec.json` — machine-readable
- [ ] Flag any conflicts: `[DECISION_NEEDED]` in AGENT_LOG.md
- [ ] Log: `[DAY2_COMPLETE]` in AGENT_LOG.md

---

## DAY 3 — Medallion Artwork Prompts
**Model:** `qwen3:30b`  
**Goal:** 15 ComfyUI prompts per region tier (scaled to priority regions first)

- [ ] Read `medallion_concept_brief.md` and `region_registry_spec.md`
- [ ] Select 3 priority regions for initial artwork batch (highest community interest)
- [ ] Generate `projects/CATBOTICA/workflow/comfyui_workflows/medallion_prompts.md`:
  - 5 prompts per priority region × 3 regions = 15 prompts
  - Each prompt: subject, lens (e.g. 50mm T2.0), lighting (Kelvin + description), film stock, color LUT, aspect ratio
  - CATBOTICA visual language: anime-adjacent, collectible-card aesthetic, vibrant color
  - Flux.1-Dev optimized syntax
  - Negative prompts included
- [ ] Generate companion `medallion_prompts.json` for ComfyUI API batch import
- [ ] Log: `[DAY3_COMPLETE]` in AGENT_LOG.md

---

## DAY 4 — Medallion Artwork Generation
**Model:** ComfyUI Flux.1-Dev (GPU) → `qwen3-vl:32b` (QA)  
**Goal:** Generate 15 medallion artworks, QA for visual consistency

- [ ] Check VRAM lock: `Get-ChildItem E:\thebeyondverse\BEYONDVERSE_STUDIO\.locks`
- [ ] Acquire lock: `python Scripts/manifest_manager.py --silo 02_Character_Forge --status ACTIVE --vram 16.0`
- [ ] Load `medallion_prompts.json` into ComfyUI batch queue (API: `http://localhost:8188`)
- [ ] Run overnight ComfyUI generation — output to `projects/CATBOTICA/workflow/reference_cards/medallions/`
- [ ] QA pass with `qwen3-vl:32b`: check each medallion for style consistency, brand alignment, region identity
- [ ] Flag any rejects for regeneration: `[REGEN_NEEDED]` in AGENT_LOG.md
- [ ] Release VRAM lock: `python Scripts/manifest_manager.py --silo 02_Character_Forge --status IDLE --vram 0.0`
- [ ] Log: `[DAY4_COMPLETE]` with pass/fail count in AGENT_LOG.md

---

## DAY 5 — Mint Contract Spec
**Model:** `devstral:latest` (draft) → Cursor Claude Sonnet (review)  
**Goal:** ERC-721 mint contract with region metadata on-chain

- [ ] Research `projects/CATBOTICA/web3/` for any prior contract work
- [ ] Draft `projects/CATBOTICA/web3/contracts/CATBOTICA_Medallion_Spec.md`:
  - ERC-721 base (medallion NFT)
  - On-chain region attribute (immutable — set at mint)
  - Supply caps per region enforced at contract level
  - Mint price: 0.05–0.08 ETH per region (or flat rate, TBD)
  - Royalties: 5–7.5% secondary
  - Reveal mechanic: instant reveal (no blind box)
  - Burn mechanic: optional upgrade path
- [ ] Scaffold `projects/CATBOTICA/web3/contracts/CATBOTICAMedallion.sol` — ERC-721 base only
- [ ] Flag for Cursor Sonnet review: `[DECISION_NEEDED: Contract audit before deployment]`
- [ ] Log: `[DAY5_COMPLETE]` in AGENT_LOG.md

---

## DAY 6 — Drop Page Scaffold
**Model:** `devstral:latest`  
**Goal:** Next.js drop page with mint button and region selector

- [ ] Scaffold `projects/CATBOTICA/web/apps/drop-page/` (Next.js 14+, TypeScript, Tailwind)
- [ ] Components:
  - Hero: medallion showcase (top 3 regions)
  - Region selector: click region → shows supply remaining, mint price
  - Mint button: connect wallet → mint to selected region
  - Collection gallery: show all minted medallions (region distribution)
- [ ] Web3 hooks: wagmi + viem, Ethereum mainnet
- [ ] Chain safety: `chainId` check before any transaction
- [ ] No private keys in frontend
- [ ] Integration: link to THEBEYONDVERSE hub, XPOINTS earning display
- [ ] Flag for Cursor Sonnet review: `[DECISION_NEEDED: UI/UX review before launch]`
- [ ] Log: `[DAY6_COMPLETE]` in AGENT_LOG.md

---

## DAY 7 — Full Review + QA
**Model:** `qwen3-vl:32b` (art QA) + Cursor Claude Sonnet (contract + code review)  
**Goal:** Final QA pass, AGENT_LOG summary, operator go/no-go decision

- [ ] Art QA: run `qwen3-vl:32b` over all 15 medallion artworks — consistency score per piece
- [ ] Contract review: flag `CATBOTICA_Medallion_Spec.md` for Cursor Sonnet session
- [ ] Code review: flag drop page for Cursor Sonnet session
- [ ] Cross-check region registry vs contract spec — any mismatches?
- [ ] Compile AGENT_LOG.md summary for Days 1–7
- [ ] Write `projects/CATBOTICA/metadata/SPRINT1_SUMMARY.md`:
  - What shipped
  - What's pending (blockers, decisions)
  - Recommended next sprint priorities (remaining 9 regions artwork, full mint contract deploy)
- [ ] Flag to operator: `[DECISION_NEEDED: Go/No-Go for medallion mint launch]`
- [ ] Log: `[DAY7_COMPLETE]` + `[SPRINT1_COMPLETE]` in AGENT_LOG.md

---

## BACKLOG (after Sprint 1)

- [ ] Remaining regions artwork (9 more regions if 3 done in Sprint 1)
- [ ] Full region registry smart contract deploy (testnet first)
- [ ] CATBOTICA X announcement content (medallion reveals, region teasers)
- [ ] 929er character reference cards — full set (all classes)
- [ ] Mint contract external audit (pre-launch)
- [ ] THEBEYONDVERSE hub full integration (region displayed on hub profile)
- [ ] XPOINTS integration: earning points for holding CATBOTICA medallion

---

*Last updated: February 2026 by BeyondVerse Nexus (Cursor + Claude)*  
*Next review: End of Day 7*
