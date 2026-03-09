# CATBOTICA Day 3 — Medallion Artwork Prompts
**Copy and paste this entire message into Void Agent Chat (Ctrl+L)**  
**Recommended model:** `qwen3:30b` (prompt engineering)

---

## WHO YOU ARE

You are the BeyondVerse Nexus Production Engine. You are working on CATBOTICA project Day 3: Medallion Artwork Prompts for ComfyUI.

---

## TASK OVERVIEW

Generate 15 ComfyUI prompts (5 prompts per priority region × 3 regions) for initial artwork batch. Select 3 priority regions first, then generate prompts.

---

## STEP 1: Read Lore Documents

1. Read `projects/CATBOTICA/metadata/medallion_concept_brief.md`
2. Read `projects/CATBOTICA/metadata/region_registry_spec.md`

**Output:** Summarize visual themes and priority regions.

---

## STEP 2: Select Priority Regions

From `region_registry_spec.md`, select 3 priority regions (highest community interest or most unique visual themes).

**Output:** List the 3 selected regions.

---

## STEP 3: Generate Prompts

Create `projects/CATBOTICA/workflow/comfyui_workflows/medallion_prompts.md`:

```markdown
# CATBOTICA Medallion Artwork Prompts — ComfyUI Flux.1-Dev

## Priority Region 1: [Name] (5 prompts)

### Prompt 1.1
**Subject:** [Describe medallion design based on region + tier lore]
**Lens:** 50mm T2.0
**Lighting:** 5600K daylight, soft key light, rim light
**Film Stock:** Kodak Vision3 500T
**Color LUT:** Vibrant anime-adjacent LUT, saturated colors
**Aspect Ratio:** 1:1
**Negative Prompt:** blurry, low quality, distorted, watermark, text

### Prompt 1.2-1.5
[Repeat structure for 4 more prompts]

## Priority Region 2: [Name] (5 prompts)
[Same structure]

## Priority Region 3: [Name] (5 prompts)
[Same structure]
```

**Important:** Reference visual themes from concept brief. Use CATBOTICA visual language (anime-adjacent, collectible-card aesthetic, vibrant color).

---

## STEP 4: Generate JSON

Create `projects/CATBOTICA/workflow/comfyui_workflows/medallion_prompts.json` (same structure as KARAFURU badge_prompts.json).

---

## STEP 5: Log Completion

Append to `projects/CATBOTICA/metadata/AGENT_LOG.md`:

```markdown
- `[DATE] [TIME]` [COMPLETE] Day 3 — Medallion Artwork Prompts
  **Model:** qwen3:30b
  **Actions:**
  - Selected 3 priority regions
  - Created medallion_prompts.md with 15 prompts (5 per region)
  - Generated medallion_prompts.json for ComfyUI API
  **Blockers:** None
```

---

**When done, say:** "✅ Day 3 complete. 15 medallion artwork prompts generated. Ready for Day 4 ComfyUI generation."
