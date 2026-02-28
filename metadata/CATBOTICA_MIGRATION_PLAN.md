---
uuid: NEXUS-MIGR-0001
status: Production
tags: [migration, catbotica, project-setup]
last_sync: 2026-02-05
---

# CATBOTICA Migration Plan

**Source:** `E:\thebeyondverse\CATBOTICA`  
**Target:** `E:\thebeyondverse\BEYONDVERSE_STUDIO\projects\CATBOTICA` + `01_Lore_Sanctum/`

**Strategy:** Hybrid Approach (Migrate active content, preserve original)

---

## MIGRATION OVERVIEW

### What Gets Migrated Where

| CATBOTICA Source | Studio Destination | Type |
|-----------------|-------------------|------|
| `bible/characters.md` | `01_Lore_Sanctum/Characters/Protagonists/` | Individual character files |
| `bible/worldbuilding.md` | `01_Lore_Sanctum/Bible/Core_World_Rules.md` | World rules extraction |
| `bible/timeline.md` | `01_Lore_Sanctum/Timelines/Global_Timeline.md` | Timeline events |
| `bible/lexicon.md` | `01_Lore_Sanctum/Bible/CATBOTICA_Lexicon.md` | Lexicon terms |
| `workflow/comfyui-prompts.md` | `projects/CATBOTICA/workflow/comfyui_workflows/` | Workflow files |
| `workflow/blender-ue5-reference.md` | `projects/CATBOTICA/workflow/blender_scenes/` | 3D references |
| `bible/images/` | `projects/CATBOTICA/workflow/reference_cards/` | Visual assets |
| `workflow/exports/*.json` | `projects/CATBOTICA/metadata/` | JSON exports (reference) |
| Entire `CATBOTICA/` | `projects/CATBOTICA/archive/` | Symlink for reference |

---

## PHASE 1: PROJECT STRUCTURE SETUP

### Step 1.1: Create Project Folder

```powershell
# Navigate to studio root
cd E:\thebeyondverse\BEYONDVERSE_STUDIO

# Create project structure
New-Item -ItemType Directory -Path "projects/CATBOTICA" -Force
New-Item -ItemType Directory -Path "projects/CATBOTICA/metadata" -Force
New-Item -ItemType Directory -Path "projects/CATBOTICA/characters" -Force
New-Item -ItemType Directory -Path "projects/CATBOTICA/environments" -Force
New-Item -ItemType Directory -Path "projects/CATBOTICA/exports/renders" -Force
New-Item -ItemType Directory -Path "projects/CATBOTICA/exports/videos" -Force
New-Item -ItemType Directory -Path "projects/CATBOTICA/exports/final_assets" -Force
New-Item -ItemType Directory -Path "projects/CATBOTICA/workflow/comfyui_workflows" -Force
New-Item -ItemType Directory -Path "projects/CATBOTICA/workflow/blender_scenes" -Force
New-Item -ItemType Directory -Path "projects/CATBOTICA/workflow/reference_cards" -Force
```

### Step 1.2: Create Project README

```markdown
# CATBOTICA Project

**Status:** Migration In Progress  
**Created:** 2026-02-05  
**Source:** E:\thebeyondverse\CATBOTICA

## Project Overview
[Description from CATBOTICA README]

## Characters
- See: `01_Lore_Sanctum/Characters/Protagonists/` for character bibles
- 3D Models: `./characters/`

## Workflows
- ComfyUI: `./workflow/comfyui_workflows/`
- Blender: `./workflow/blender_scenes/`

## Archive
- Original files: `./archive/` (symlink to E:\thebeyondverse\CATBOTICA)
```

---

## PHASE 2: LORE MIGRATION

### Step 2.1: Extract World Rules

**Script:** `01_Lore_Sanctum/scripts/migrate_catbotica_world.py`

**Process:**
1. Read `CATBOTICA/bible/worldbuilding.md`
2. Extract core rules (technology, physics, culture)
3. Format for `Core_World_Rules.md`
4. Add YAML frontmatter with UUID

### Step 2.2: Migrate Characters

**Script:** `01_Lore_Sanctum/scripts/migrate_catbotica_characters.py`

**Process:**
1. Parse `CATBOTICA/bible/characters.md` (or use JSON export)
2. Split into individual character files
3. Generate UUID for each character
4. Extract Forge specs from physical descriptions
5. Create files in `Characters/Protagonists/` or `Characters/Antagonists/`
6. Add YAML frontmatter
7. Add `forge_specs` block

**Character Priority:**
1. Robot 929R (Protagonist)
2. Anthropomorphic Cat Character
3. Anthropomorphic Dog Character
4. John (Recurring)
5. [Other characters as needed]

### Step 2.3: Migrate Timeline

**Script:** `01_Lore_Sanctum/scripts/migrate_catbotica_timeline.py`

**Process:**
1. Read `CATBOTICA/bible/timeline.md`
2. Extract chronological events
3. Format for `Timelines/Global_Timeline.md`
4. Preserve page references

### Step 2.4: Migrate Lexicon

**Script:** `01_Lore_Sanctum/scripts/migrate_catbotica_lexicon.py`

**Process:**
1. Read `CATBOTICA/bible/lexicon.md`
2. Create `Bible/CATBOTICA_Lexicon.md`
3. Format with YAML frontmatter

---

## PHASE 3: WORKFLOW MIGRATION

### Step 3.1: Copy Workflow Files

```powershell
# ComfyUI prompts
Copy-Item -Path "E:\thebeyondverse\CATBOTICA\workflow\comfyui-prompts.md" -Destination "projects/CATBOTICA/workflow/comfyui_workflows/"

# Blender/UE5 reference
Copy-Item -Path "E:\thebeyondverse\CATBOTICA\workflow\blender-ue5-reference.md" -Destination "projects/CATBOTICA/workflow/blender_scenes/"

# Three.js integration
Copy-Item -Path "E:\thebeyondverse\CATBOTICA\workflow\threejs-integration.md" -Destination "projects/CATBOTICA/workflow/"

# Character reference cards
Copy-Item -Path "E:\thebeyondverse\CATBOTICA\workflow\character-reference-cards.md" -Destination "projects/CATBOTICA/workflow/reference_cards/"
```

### Step 3.2: Copy Visual Assets

```powershell
# Copy character class images
Copy-Item -Path "E:\thebeyondverse\CATBOTICA\bible\images\character-classes\*" -Destination "projects/CATBOTICA/workflow/reference_cards/character_classes/" -Recurse

# Copy elemental images
Copy-Item -Path "E:\thebeyondverse\CATBOTICA\bible\images\elementals\*" -Destination "projects/CATBOTICA/workflow/reference_cards/elementals/" -Recurse
```

### Step 3.3: Copy JSON Exports

```powershell
# Copy JSON exports for reference
Copy-Item -Path "E:\thebeyondverse\CATBOTICA\workflow\exports\*.json" -Destination "projects/CATBOTICA/metadata/"
```

---

## PHASE 4: ARCHIVE SETUP

### Step 4.1: Create Symlink

```powershell
# Create symlink to original CATBOTICA
New-Item -ItemType SymbolicLink -Path "projects/CATBOTICA/archive" -Target "E:\thebeyondverse\CATBOTICA"
```

**Alternative (if symlinks not supported):**
```powershell
# Create reference file instead
@"
# CATBOTICA Archive Reference

Original location: E:\thebeyondverse\CATBOTICA

This folder contains the original CATBOTICA project files.
Access them directly at the source location.
"@ | Out-File -FilePath "projects/CATBOTICA/archive/README.md"
```

---

## PHASE 5: VALIDATION

### Step 5.1: Validate Migration

**Script:** `01_Lore_Sanctum/scripts/validate_migration.py`

**Checks:**
1. All characters have UUIDs
2. All characters have YAML frontmatter
3. All characters have forge_specs blocks
4. Timeline events are properly formatted
5. World rules extracted correctly
6. No duplicate UUIDs

### Step 5.2: Test Sync

```bash
# Test Lore Sanctum → Character Forge sync
cd 01_Lore_Sanctum/scripts
python sync_to_forge.py

# Verify JSON exports created
ls 01_Lore_Sanctum/Exports/
```

---

## MIGRATION SCRIPT USAGE

### Automated Migration

```powershell
# Run full migration
cd E:\thebeyondverse\BEYONDVERSE_STUDIO
python Scripts/migrate_catbotica_full.py

# Or run phase by phase
python Scripts/migrate_catbotica_phase1.py  # Structure setup
python Scripts/migrate_catbotica_phase2.py  # Lore migration
python Scripts/migrate_catbotica_phase3.py  # Workflow migration
python Scripts/migrate_catbotica_phase4.py  # Archive setup
python Scripts/migrate_catbotica_validate.py # Validation
```

### Manual Migration

Follow phases 1-5 above step-by-step.

---

## POST-MIGRATION

### Update References

1. **Update CATBOTICA_Reference.md** in Lore Sanctum to point to migrated entries
2. **Create cross-reference document** in project metadata
3. **Update project README** with migration status

### Cleanup (Optional)

After validation:
- Archive original CATBOTICA (if desired)
- Remove duplicate files (if any)
- Update documentation

---

## ROLLBACK PLAN

If migration fails:

1. **Original files preserved** at `E:\thebeyondverse\CATBOTICA`
2. **No deletion** during migration (only creation)
3. **Can revert** by deleting `projects/CATBOTICA/` and `01_Lore_Sanctum/Characters/` entries

---

## SUCCESS CRITERIA

- [ ] Project folder structure created
- [ ] 5+ key characters migrated to Lore Sanctum
- [ ] World rules extracted to Core_World_Rules.md
- [ ] Timeline migrated to Global_Timeline.md
- [ ] Workflow files copied to project
- [ ] Visual assets copied to project
- [ ] Archive symlink/reference created
- [ ] Validation passes (no errors)
- [ ] Sync to Character Forge works
- [ ] Project README complete

---

```json
{
  "sync_metadata": {
    "document_type": "migration_plan",
    "version": "1.0",
    "last_updated": "2026-02-05",
    "status": "ready_for_execution"
  }
}
```
