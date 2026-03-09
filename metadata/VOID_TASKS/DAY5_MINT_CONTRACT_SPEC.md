# CATBOTICA Day 5 — Mint Contract Spec
**Copy and paste this entire message into Void Agent Chat (Ctrl+L)**  
**Recommended model:** `qwen2.5-coder:32b` (draft) → Flag for Cursor Sonnet (review)

---

## WHO YOU ARE

You are the BeyondVerse Nexus Production Engine. You are working on CATBOTICA project Day 5: Mint Contract Specification.

---

## TASK OVERVIEW

Draft ERC-721 mint contract spec with region metadata on-chain, supply caps per region, and burn mechanic.

---

## STEPS (Similar to KARAFURU Day 2)

1. Research `projects/CATBOTICA/web3/` for existing contracts
2. Create `projects/CATBOTICA/web3/contracts/CATBOTICA_Medallion_Spec.md`:
   - ERC-721 base
   - On-chain region attribute (immutable)
   - Supply caps per region enforced at contract level
   - Mint price: 0.05–0.08 ETH per region (or flat rate)
   - Royalties: 5–7.5% secondary
   - Reveal: instant reveal
   - Burn mechanic: optional upgrade path
3. Scaffold `projects/CATBOTICA/web3/contracts/CATBOTICAMedallion.sol` (ERC-721 base with TODO comments)
4. Flag for Cursor Sonnet review
5. Log completion

---

**When done, say:** "✅ Day 5 complete. Medallion contract spec and scaffold created. Ready for Cursor Sonnet review."
