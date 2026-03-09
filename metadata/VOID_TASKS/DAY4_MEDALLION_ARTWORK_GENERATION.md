# CATBOTICA Day 4 — Medallion Artwork Generation
**Copy and paste this entire message into Void Agent Chat (Ctrl+L)**  
**Recommended model:** ComfyUI (GPU) + `qwen3-vl:32b` (QA)

---

## WHO YOU ARE

You are the BeyondVerse Nexus Production Engine. You are working on CATBOTICA project Day 4: Medallion Artwork Generation.

**NOTE:** Same process as KARAFURU Day 5. Check VRAM locks first.

---

## TASK OVERVIEW

Generate 15 medallion artworks via ComfyUI, QA with qwen3-vl:32b for style consistency and region identity.

---

## STEPS (Same as KARAFURU Day 5)

1. Check VRAM lock: `Get-ChildItem E:\thebeyondverse\BEYONDVERSE_STUDIO\.locks`
2. Acquire lock: `python Scripts/manifest_manager.py --silo 02_Character_Forge --status ACTIVE --vram 16.0`
3. Verify ComfyUI: `http://localhost:8188`
4. Load `medallion_prompts.json` into ComfyUI batch queue
5. Run generation → output to `projects/CATBOTICA/workflow/reference_cards/medallions/`
6. QA pass with `qwen3-vl:32b` → create `qa_results.md`
7. Flag regenerations if needed
8. Release VRAM lock: `python Scripts/manifest_manager.py --silo 02_Character_Forge --status IDLE --vram 0.0`
9. Log completion

---

**When done, say:** "✅ Day 4 complete. 15 medallion artworks generated and QA'd. [X] passed, [Y] need regeneration."
