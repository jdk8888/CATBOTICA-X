#!/usr/bin/env python3
"""
CATBOTICA Zodiac Badge Post-Processor — Silo 07 (Post-Prod)
=============================================================
Post-processes raw zodiac badge PNGs: background removal + upscaling.

Pipeline:
  1. Read raw badges from projects/CATBOTICA/Exports/draft/badges/raw/
  2. Background removal via rembg (AI-based, u2net model)
  3. Upscale 1024→2048 via Pillow LANCZOS (or optional Real-ESRGAN)
  4. Output to projects/CATBOTICA/Exports/draft/badges/ (transparent, upscaled, final)

VRAM: ~2GB (rembg uses ONNX on CPU/GPU, Pillow upscale is CPU-only)
Lore Anchor: LS-CATBOTICA-ANCHOR-012

Dependencies:
  pip install rembg Pillow onnxruntime

Usage:
  python postprocess_badges.py                   # Process all badges
  python postprocess_badges.py --only horse      # Process one badge
  python postprocess_badges.py --skip-bg         # Skip background removal
  python postprocess_badges.py --skip-upscale    # Skip upscaling
  python postprocess_badges.py --upscale-factor 4  # 4x upscale (4096x4096)
  python postprocess_badges.py --dry-run         # Preview only
"""

import sys
import subprocess
import argparse
import time
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("[ERROR] Pillow not installed. Run: pip install Pillow")
    sys.exit(1)

try:
    from rembg import remove as rembg_remove
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False
    print("[WARN] rembg not installed. Background removal disabled.")
    print("  Install with: pip install rembg onnxruntime")


# ─── Paths ──────────────────────────────────────────────────────────────────
STUDIO_ROOT = Path("E:/thebeyondverse/BEYONDVERSE_STUDIO")
PROJECT_ROOT = STUDIO_ROOT / "projects" / "CATBOTICA"
BADGES_BASE = PROJECT_ROOT / "Exports" / "draft" / "badges"
RAW_INPUT_DIR = BADGES_BASE / "raw"  # default; with --draft-label use raw/<label>/
DRAFT_OUTPUT_DIR = BADGES_BASE
SCRIPTS_DIR = STUDIO_ROOT / "Scripts"


def get_raw_input_dir(draft_label: str | None) -> Path:
    """Raw input dir: raw/<draft_label>/ when draft_label set, else raw/."""
    if draft_label:
        return BADGES_BASE / "raw" / draft_label
    return BADGES_BASE / "raw"


def get_output_dirs(draft_label: str | None) -> tuple[Path, Path, Path]:
    """Transparent, upscaled, final dirs; when draft_label set, use subdirs."""
    if draft_label:
        return (
            DRAFT_OUTPUT_DIR / "transparent" / draft_label,
            DRAFT_OUTPUT_DIR / "upscaled" / draft_label,
            DRAFT_OUTPUT_DIR / "final" / draft_label,
        )
    return (
        DRAFT_OUTPUT_DIR / "transparent",
        DRAFT_OUTPUT_DIR / "upscaled",
        DRAFT_OUTPUT_DIR / "final",
    )


# Sub-directories for each processing stage (default; use get_output_dirs(draft_label) for variants)
TRANSPARENT_DIR = DRAFT_OUTPUT_DIR / "transparent"
UPSCALED_DIR = DRAFT_OUTPUT_DIR / "upscaled"
FINAL_DIR = DRAFT_OUTPUT_DIR / "final"  # upscaled + transparent

SILO_NAME = "07_Post_Prod"
VRAM_ESTIMATE_GB = 2.0

# Expected badge names (matches generation order)
# Order matches generator: Horse then Monkey (style anchors), then rest
BADGE_NAMES = [
    "horse", "monkey", "dog", "tiger", "rabbit", "dragon", "snake",
    "goat", "rooster", "pig", "rat", "ox",
]


# ─── VRAM Lock Management ──────────────────────────────────────────────────


def acquire_vram_lock() -> bool:
    """Acquire VRAM lock for Silo 07."""
    cmd = [
        sys.executable,
        str(SCRIPTS_DIR / "manifest_manager.py"),
        "--silo", SILO_NAME,
        "--status", "ACTIVE",
        "--vram", str(VRAM_ESTIMATE_GB),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout.strip())
    if result.returncode != 0:
        print(f"[ERROR] VRAM lock failed:\n{result.stderr.strip()}")
        return False
    return True


def release_vram_lock():
    """Release VRAM lock for Silo 07."""
    cmd = [
        sys.executable,
        str(SCRIPTS_DIR / "manifest_manager.py"),
        "--silo", SILO_NAME,
        "--status", "IDLE",
        "--vram", "0.0",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout.strip())


# ─── Processing Functions ──────────────────────────────────────────────────


def remove_background(input_path: Path, output_path: Path) -> bool:
    """
    Remove background from a badge image using rembg.

    Args:
        input_path: Path to raw badge PNG (solid black background).
        output_path: Path for transparent PNG output.

    Returns:
        True if successful.
    """
    if not REMBG_AVAILABLE:
        print("  [SKIP] rembg not available — cannot remove background")
        return False

    try:
        with open(input_path, "rb") as f:
            input_data = f.read()

        output_data = rembg_remove(input_data)

        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(output_data)

        return True
    except Exception as e:
        print(f"  [ERROR] Background removal failed: {e}")
        return False


def upscale_image(input_path: Path, output_path: Path, factor: int = 2) -> bool:
    """
    Upscale a badge image using Pillow LANCZOS resampling.

    For production AI upscaling, consider Real-ESRGAN via ComfyUI instead.
    Pillow LANCZOS is clean and artifact-free for hard-surface mechanical art.

    Args:
        input_path: Path to input PNG.
        output_path: Path for upscaled PNG output.
        factor: Upscale factor (2 = 1024→2048, 4 = 1024→4096).

    Returns:
        True if successful.
    """
    try:
        img = Image.open(input_path)
        new_size = (img.width * factor, img.height * factor)
        upscaled = img.resize(new_size, Image.LANCZOS)

        output_path.parent.mkdir(parents=True, exist_ok=True)
        upscaled.save(output_path, "PNG", optimize=True)

        return True
    except Exception as e:
        print(f"  [ERROR] Upscale failed: {e}")
        return False


# ─── Main Pipeline ─────────────────────────────────────────────────────────


def run_pipeline(args):
    """Execute the post-processing pipeline."""
    draft_label = getattr(args, "draft_label", None)
    raw_input_dir = get_raw_input_dir(draft_label)
    transparent_dir, upscaled_dir, final_dir = get_output_dirs(draft_label)

    print("=" * 70)
    print("CATBOTICA ZODIAC BADGE POST-PROCESSOR — Silo 07 (Post-Prod)")
    print("Lore Anchor: LS-CATBOTICA-ANCHOR-012")
    print(f"Input:  {raw_input_dir}")
    print(f"Output: {DRAFT_OUTPUT_DIR}" + (f" (variant: {draft_label})" if draft_label else ""))
    print(f"Upscale Factor: {args.upscale_factor}x")
    print("=" * 70)

    # ── Discover raw badges ──
    if args.only:
        badge_names = [args.only]
    else:
        badge_names = BADGE_NAMES

    raw_files = []
    for name in badge_names:
        raw_path = raw_input_dir / f"{name}.png"
        if raw_path.exists():
            raw_files.append((name, raw_path))
        else:
            print(f"  [WARN] Missing raw badge: {raw_path}")

    if not raw_files:
        print("[ERROR] No raw badge files found in input directory.")
        print(f"  Expected: {raw_input_dir}/<name>.png")
        print("  Run generate_zodiac_badges.py first (Silo 03).")
        return False

    print(f"\n[INFO] Found {len(raw_files)} raw badge(s): "
          f"{', '.join(n.upper() for n, _ in raw_files)}")

    if args.dry_run:
        print("\n[DRY RUN] Would process:")
        for name, path in raw_files:
            steps = []
            if not args.skip_bg:
                steps.append("bg-remove")
            if not args.skip_upscale:
                steps.append(f"upscale-{args.upscale_factor}x")
            print(f"  - {name}.png → [{', '.join(steps)}]")
        print("\n[DRY RUN] No files modified. Remove --dry-run to execute.")
        return True

    # ── Acquire VRAM lock ──
    if not args.skip_lock:
        print(f"\n[LOCK] Acquiring VRAM lock ({SILO_NAME}, {VRAM_ESTIMATE_GB}GB)...")
        if not acquire_vram_lock():
            print("[ERROR] Cannot acquire VRAM lock.")
            return False
    else:
        print("\n[LOCK] Skipped (--skip-lock)")

    try:
        # Create output directories
        for d in [transparent_dir, upscaled_dir, final_dir]:
            d.mkdir(parents=True, exist_ok=True)

        results = []
        total = len(raw_files)

        for i, (name, raw_path) in enumerate(raw_files, 1):
            print(f"\n--- [{i}/{total}] {name.upper()} ---")
            result = {"name": name, "bg_removed": False, "upscaled": False, "final": False}

            # Step A: Background Removal
            if not args.skip_bg:
                transparent_path = transparent_dir / f"{name}_transparent.png"
                if transparent_path.exists() and not args.force:
                    print(f"  [SKIP] Transparent version exists: {transparent_path.name}")
                    result["bg_removed"] = True
                else:
                    print(f"  [BG] Removing background...")
                    start = time.time()
                    ok = remove_background(raw_path, transparent_path)
                    elapsed = time.time() - start
                    if ok:
                        print(f"  [OK] Background removed ({elapsed:.1f}s): {transparent_path.name}")
                        result["bg_removed"] = True
                    else:
                        print(f"  [FAIL] Background removal failed for {name}")

            # Step B: Upscale raw (black background version)
            if not args.skip_upscale:
                upscaled_path = upscaled_dir / f"{name}_{args.upscale_factor}x.png"
                if upscaled_path.exists() and not args.force:
                    print(f"  [SKIP] Upscaled version exists: {upscaled_path.name}")
                    result["upscaled"] = True
                else:
                    target_res = 1024 * args.upscale_factor
                    print(f"  [UP] Upscaling to {target_res}x{target_res} "
                          f"({args.upscale_factor}x LANCZOS)...")
                    ok = upscale_image(raw_path, upscaled_path, args.upscale_factor)
                    if ok:
                        print(f"  [OK] Upscaled: {upscaled_path.name}")
                        result["upscaled"] = True

            # Step C: Upscale transparent version (final deliverable)
            if not args.skip_bg and not args.skip_upscale and result["bg_removed"]:
                final_path = final_dir / f"{name}_final_{args.upscale_factor}x.png"
                transparent_src = transparent_dir / f"{name}_transparent.png"
                if final_path.exists() and not args.force:
                    print(f"  [SKIP] Final version exists: {final_path.name}")
                    result["final"] = True
                elif transparent_src.exists():
                    print(f"  [FINAL] Upscaling transparent version...")
                    ok = upscale_image(transparent_src, final_path, args.upscale_factor)
                    if ok:
                        print(f"  [OK] Final deliverable: {final_path.name}")
                        result["final"] = True

            results.append(result)

        # ── Summary ──
        print("\n" + "=" * 70)
        print("POST-PROCESSING COMPLETE")
        print("=" * 70)
        print(f"\n  Output structure:")
        print(f"    {transparent_dir}/  — Transparent PNGs (bg removed)")
        print(f"    {upscaled_dir}/     — Upscaled PNGs (black bg)")
        print(f"    {final_dir}/        — Final deliverables (transparent + upscaled)")

        print(f"\n  Results:")
        for r in results:
            flags = []
            if r["bg_removed"]:
                flags.append("BG")
            if r["upscaled"]:
                flags.append("UP")
            if r["final"]:
                flags.append("FINAL")
            print(f"    {r['name'].upper():>8} — [{', '.join(flags) or 'NONE'}]")

        bg_count = sum(1 for r in results if r["bg_removed"])
        up_count = sum(1 for r in results if r["upscaled"])
        final_count = sum(1 for r in results if r["final"])
        print(f"\n  Totals: {bg_count} bg-removed, {up_count} upscaled, {final_count} final")

        print(f"\n[NEXT STEPS]")
        print(f"  1. Review outputs in: {DRAFT_OUTPUT_DIR}")
        print(f"  2. Upload final PNGs to IPFS")
        print(f"  3. Update metadata CIDs in: projects/CATBOTICA/metadata/onchain/erc1155/")
        print(f"  4. Redeploy claim page with updated image URIs")

        return True

    except Exception as e:
        print(f"\n[FATAL] Pipeline error: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        if not args.skip_lock:
            print(f"\n[CLEANUP] Releasing VRAM lock ({SILO_NAME})...")
            release_vram_lock()


# ─── CLI ────────────────────────────────────────────────────────────────────


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="CATBOTICA Zodiac Badge Post-Processor (Silo 07)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python postprocess_badges.py                      # Process all\n"
            "  python postprocess_badges.py --only horse         # One badge\n"
            "  python postprocess_badges.py --skip-bg            # Upscale only\n"
            "  python postprocess_badges.py --upscale-factor 4   # 4K output\n"
        ),
    )
    parser.add_argument("--dry-run", action="store_true", help="Preview without processing")
    parser.add_argument("--only", type=str, help="Process only one badge by name")
    parser.add_argument("--skip-bg", action="store_true", help="Skip background removal")
    parser.add_argument("--skip-upscale", action="store_true", help="Skip upscaling")
    parser.add_argument("--upscale-factor", type=int, default=2,
                        choices=[2, 4], help="Upscale factor (default: 2 → 2048x2048)")
    parser.add_argument("--force", action="store_true", help="Overwrite existing outputs")
    parser.add_argument("--skip-lock", action="store_true", help="Skip VRAM lock (dev mode)")
    parser.add_argument("--draft-label", type=str, default=None,
                        help="Draft variant: read from raw/<label>/ and write to transparent/<label>/ etc. (e.g. cute_cartoon)")
    args = parser.parse_args()

    success = run_pipeline(args)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
