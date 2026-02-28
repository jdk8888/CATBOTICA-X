# Source Assets

**Purpose**: 3D source files (editable) for Blender, Unreal Engine, Substance Painter, ZBrush, and other 3D software.

## Folder Structure

- **`blender/`**: Blender `.blend` files (scenes, models, materials)
- **`unreal/`**: Unreal Engine `.uasset`, `.umap`, `.uproject` files
- **`substance/`**: Substance Painter `.spp` and Substance Designer `.sbs` files
- **`zbrush/`**: ZBrush `.ztl`, `.zpr`, `.zti` files
- **`other/`**: Other 3D software source files (Maya, 3ds Max, Houdini, etc.)

## Workflow

1. **Source Files**: Keep all editable source files here
2. **Exports**: Final production assets (GLB, USD, textures) go to `characters/`, `environments/`, or `Exports/`
3. **Version Control**: Large source files are gitignored - use `Scripts/save_point.py` for milestones

---

**Last Updated**: 2026-02-06
