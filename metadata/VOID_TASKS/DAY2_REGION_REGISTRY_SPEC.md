# CATBOTICA Day 2 — Region Registry Spec
**Copy and paste this entire message into Void Agent Chat (Ctrl+L)**  
**Recommended model:** `qwen3:30b` (design) → `phi4:14b` (verification)

---

## WHO YOU ARE

You are the BeyondVerse Nexus Production Engine. You are working on CATBOTICA project Day 2: Region Registry Specification.

---

## TASK OVERVIEW

Define the region system — regions (8-12), supply caps, burn/register mechanic, and on-chain metadata schema. Verify consistency with Day 1 medallion concept.

---

## STEP 1: Read Day 1 Output

Read `projects/CATBOTICA/metadata/medallion_concept_brief.md` from Day 1.

**Output:** Summarize key points (tiers, classes, mechanics).

---

## STEP 2: Generate Region Registry Spec

Create `projects/CATBOTICA/metadata/region_registry_spec.md`:

```markdown
# CATBOTICA Region Registry Specification

## Region List (8-12 regions)

### Region 1: [Name]
- **929er Class Mapping:** [Which classes?]
- **Supply Cap:** [Number, e.g., 1,000]
- **Visual Theme:** [From medallion concept]
- **Lore Anchor UUID:** `CATBOTICA-REGION-001-[NAME]`

### Region 2: [Name]
[Repeat for all 8-12 regions]

## Supply Caps Per Region
- Total medallion supply: 10,000
- Distribution: [Define per region]
- Enforced at contract level

## Registration Mechanic
- **Mint = Register:** When holder mints medallion, they select region
- **Immutable:** Region assignment is on-chain, cannot be changed
- **Metadata:** Region stored as on-chain attribute

## Burn Mechanic (Optional)
- **Upgrade Path:** Burn Common medallion → receive Rare region status?
- **Implementation:** TBD (may be removed if too complex)

## Cross-IP Integration
- THEBEYONDVERSE hub: region displayed on user profile
- XPOINTS: earning potential per region (higher tier = more points)
- Future game: region determines starting class/role

## Metadata Schema (On-Chain)
```json
{
  "medallion_id": "uint256",
  "region": "string",
  "tier": "string",
  "929er_class": "string[]",
  "mint_timestamp": "uint256",
  "holder": "address"
}
```
```

---

## STEP 3: Generate JSON Version

Create `projects/CATBOTICA/metadata/region_registry_spec.json`:

```json
{
  "regions": [
    {
      "region_id": 1,
      "region_name": "...",
      "929er_classes": ["Loader", "Mechanic"],
      "supply_cap": 1000,
      "visual_theme": "...",
      "lore_anchor_uuid": "CATBOTICA-REGION-001-..."
    }
    // ... repeat for all regions
  ],
  "total_supply": 10000,
  "metadata_schema": {
    "medallion_id": "uint256",
    "region": "string",
    "tier": "string",
    "929er_class": "string[]",
    "mint_timestamp": "uint256",
    "holder": "address"
  }
}
```

---

## STEP 4: Verification Pass

Switch Void Agent model to `phi4:14b`.

Ask Agent: "Review region_registry_spec.md for lore inconsistencies vs existing CATBOTICA bible. Check medallion_concept_brief.md alignment. Flag any conflicts."

Create `projects/CATBOTICA/metadata/region_registry_verification.md`:

```markdown
# Region Registry Verification Results

## Consistency Check
- ✅ Regions align with medallion concept tiers
- ✅ Supply caps sum to total supply
- ⚠️ [Any conflicts found]

## Lore Consistency
- ✅ 929er class mappings match existing lore
- ⚠️ [Any inconsistencies]

## Flagged Issues
- [DECISION_NEEDED: description] (if any)
```

---

## STEP 5: Log Completion

Append to `projects/CATBOTICA/metadata/AGENT_LOG.md`:

```markdown
- `[DATE] [TIME]` [COMPLETE] Day 2 — Region Registry Spec
  **Model:** qwen3:30b (design) + phi4:14b (verification)
  **Actions:**
  - Created region_registry_spec.md with 8-12 regions
  - Defined supply caps per region
  - Created registration/burn mechanics
  - Generated region_registry_spec.json
  - Verification pass completed
  **Blockers:** [List any]
  **Decisions needed:** [List any flagged]
```

---

**When done, say:** "✅ Day 2 complete. Region registry spec defined and verified. Ready for Day 3 artwork prompts."
