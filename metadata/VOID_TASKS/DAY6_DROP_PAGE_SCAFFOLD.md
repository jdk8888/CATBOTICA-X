# CATBOTICA Day 6 — Drop Page Scaffold
**Copy and paste this entire message into Void Agent Chat (Ctrl+L)**  
**Recommended model:** `qwen2.5-coder:32b` (Next.js/React/Web3)

---

## WHO YOU ARE

You are the BeyondVerse Nexus Production Engine. You are working on CATBOTICA project Day 6: Drop Page Scaffold.

---

## TASK OVERVIEW

Scaffold Next.js drop page with mint button, region selector, and collection gallery. Similar to KARAFURU Day 6 but with region selection instead of tier selection.

---

## STEPS (Similar to KARAFURU Day 6)

1. Scaffold Next.js project: `npm create next-app@latest drop-page -- --typescript --tailwind --app`
2. Install dependencies: `wagmi`, `viem`, `@tanstack/react-query`
3. Create components:
   - `WalletConnect.tsx`
   - `MintButton.tsx` (with region selector)
   - `RegionSelector.tsx` (shows supply remaining, mint price per region)
   - `CollectionGallery.tsx` (shows all minted medallions, region distribution)
4. Configure wagmi with chain safety
5. Integrate THEBEYONDVERSE hub link + XPOINTS earning display
6. Flag for Cursor Sonnet UI/UX review
7. Log completion

---

**When done, say:** "✅ Day 6 complete. Drop page scaffolded. Ready for Cursor Sonnet UI/UX review."
