# CATBOTICA Day 1 — Medallion Concept Brief
**Copy and paste this entire message into Void Agent Chat (Ctrl+L)**  
**Recommended model:** `qwen3:30b` (reasoning) or `qwen2.5:72b` (if pulled for overnight)

---

## WHO YOU ARE

You are the BeyondVerse Nexus Production Engine. You are working on CATBOTICA project Day 1: Medallion Concept Brief.

You are working inside this repository:
```
E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA\
```

---

## TASK OVERVIEW

Define the New Year Medallion — meaning, rarity system (3-4 tiers), and 929er region mapping. This feeds into Day 2 region registry spec and Day 3 artwork prompts.

---

## STEP 1: Read Existing Lore

1. Read `projects/CATBOTICA/metadata/` for existing lore anchors and character data.
2. Read `01_Lore_Sanctum/projects/CATBOTICA/` for universe rules and 929er class system.
3. Check `01_Lore_Sanctum/Bible/Core_World_Rules.md` for world rules.

**Output:** Summarize relevant lore found (or "No existing CATBOTICA-specific lore found, will create new").

---

## STEP 2: Generate Medallion Concept Brief

Create `projects/CATBOTICA/metadata/medallion_concept_brief.md`:

```markdown
# CATBOTICA New Year Medallion Concept Brief

## Narrative Meaning
The New Year Medallion represents a ritual of belonging — holders register their allegiance to a specific region within the CATBOTICA universe. Each medallion is a physical manifestation of regional identity and 929er class assignment.

## Rarity Tiers (3-4 tiers)

### Tier 1: Common (60% of supply)
- **Visual Theme:** [Describe: colors, materials, design]
- **Lore Backstory:** [2-3 sentences: what does this tier represent?]
- **929er Class Mapping:** [Which classes? Loader, Mechanic, Builder?]
- **Burn/Hold Mechanics:** [What does owning grant?]
- **Lore Anchor UUID:** `CATBOTICA-MEDALLION-TIER-001-COMMON`
- **Supply:** ~6,000 medallions

### Tier 2: Rare (25% of supply)
- **Visual Theme:** [Describe]
- **Lore Backstory:** [2-3 sentences]
- **929er Class Mapping:** [Which classes?]
- **Burn/Hold Mechanics:** [What does owning grant?]
- **Lore Anchor UUID:** `CATBOTICA-MEDALLION-TIER-002-RARE`
- **Supply:** ~2,500 medallions

### Tier 3: Epic (10% of supply)
- **Visual Theme:** [Describe]
- **Lore Backstory:** [2-3 sentences]
- **929er Class Mapping:** [Which classes?]
- **Burn/Hold Mechanics:** [What does owning grant?]
- **Lore Anchor UUID:** `CATBOTICA-MEDALLION-TIER-003-EPIC`
- **Supply:** ~1,000 medallions

### Tier 4: Legendary (5% of supply) [Optional]
- [Same structure]

## Visual Style Direction
- **Overall Aesthetic:** Anime-adjacent, collectible-card aesthetic, vibrant color
- **Per Tier:** [Define color palettes, materials, motifs]
- **Aspect Ratio:** 1:1 (square, medallion format)

## 929er Class System Mapping
Map each tier to the 929er classes:
- Loader Class
- Mechanic Class
- Builder Class
- Defence Class
- Offence Class
- Amphibious Class
- Refiner Class
- Power Class
- Transport Class
- Collector Class
- Thunderfist (special)

**Note:** Higher tiers map to rarer classes.

## Burn/Hold Mechanics
- **Hold:** Medallion grants region status, XPOINTS earning potential
- **Burn:** Optional upgrade path (burn Common → receive Rare region status?)
- **Stake:** [If applicable]

## Cross-IP Integration
- THEBEYONDVERSE hub: region displayed on profile
- XPOINTS: earning points for holding medallion
- Future game: region determines starting class/role
```

---

## STEP 3: Log Completion

Append to `projects/CATBOTICA/metadata/AGENT_LOG.md`:

```markdown
- `[DATE] [TIME]` [COMPLETE] Day 1 — Medallion Concept Brief
  **Model:** qwen3:30b (or qwen2.5:72b if overnight)
  **Actions:**
  - Created medallion_concept_brief.md with 3-4 rarity tiers
  - Defined narrative meaning and visual style
  - Mapped tiers to 929er class system
  - Added UUID lore anchors per tier
  **Blockers:** None
  **Decisions needed:** None
```

---

**When done, say:** "✅ Day 1 complete. Medallion concept brief defined. Ready for Day 2 region registry spec."
