#!/usr/bin/env python3
"""
CATBOTICA Zodiac Badge Generator — Silo 03 (Arch Studio)
=========================================================
Batch generation of 12 zodiac badges via ComfyUI REST API.

AI STACK (what is used for generation):
  - ComfyUI (http://127.0.0.1:8188) — orchestration
  - FLUX 2 Dev FP8 (flux2_dev_fp8mixed.safetensors) — Black Forest Labs FLUX.2; recommended for 24GB VRAM.
    No FLUX 1. Place in ComfyUI/models/checkpoints/ (or merge from diffusion_models/ if using split files).
  - PuLID FLUX (pulid_flux_v0.9.1.safetensors) — reference-based style/identity lock;
    uses reference image (Dog master badge) so badges 2–12 match frame, colors, proportions.
  - No IP-Adapter, ControlNet, or other style nodes in this workflow.

Pipeline:
  Phase 1: Generate Horse (Master Badge) WITHOUT PuLID
  Phase 2: Upload Horse to ComfyUI/input/ as master_badge_horse.png
  Phase 3: Generate remaining 11 badges WITH PuLID (weight 1.0, end_at 1.0, denoise 0.92)
           + fixed clip_l (no animal) + minimal t5xxl (only animal token varies) + unified seed

VRAM: ~14GB (FLUX 1 Dev FP8 + PuLID)
Lore Anchor: LS-CATBOTICA-ANCHOR-012
Output: projects/CATBOTICA/Exports/draft/badges/raw/

Usage:
  python generate_zodiac_badges.py                    # Full run (all 12)
  python generate_zodiac_badges.py --dry-run           # Preview only
  python generate_zodiac_badges.py --start-from tiger  # Resume from tiger
  python generate_zodiac_badges.py --only horse        # Generate one badge
  python generate_zodiac_badges.py --skip-lock         # Skip VRAM lock (dev)
  python generate_zodiac_badges.py --draft-label cute_cartoon   # Cute friendly variant → raw/cute_cartoon/
  python generate_zodiac_badges.py --draft-label sleek_medallion  # Sleek metal medallion → raw/sleek_medallion/
"""

import json
import copy
import time
import shutil
import sys
import subprocess
import argparse
from pathlib import Path
from io import BytesIO

try:
    import requests
except ImportError:
    print("[ERROR] requests not installed. Run: pip install requests")
    sys.exit(1)


# ─── Paths ──────────────────────────────────────────────────────────────────
STUDIO_ROOT = Path("E:/thebeyondverse/BEYONDVERSE_STUDIO")
PROJECT_ROOT = STUDIO_ROOT / "projects" / "CATBOTICA"
WORKFLOW_PATH = (
    PROJECT_ROOT / "workflow" / "comfyui_workflows" / "zodiac_badge_pulid_flux2.json"
)
BADGES_BASE = PROJECT_ROOT / "Exports" / "draft" / "badges"
RAW_OUTPUT_DIR = BADGES_BASE / "raw"  # default; use get_raw_output_dir(draft_label) for variants
SCRIPTS_DIR = STUDIO_ROOT / "Scripts"


def get_raw_output_dir(draft_label: str | None) -> Path:
    """Raw output dir: raw/<draft_label>/ when draft_label set, else raw/."""
    if draft_label:
        return BADGES_BASE / "raw" / draft_label
    return BADGES_BASE / "raw"

COMFYUI_URL = "http://127.0.0.1:8188"
SILO_NAME = "03_Arch_Studio"
VRAM_ESTIMATE_GB = 14.0

# Checkpoint: use FLUX 2 if present in ComfyUI checkpoints, else fall back to FLUX 1 for pipeline to run.
CHECKPOINT_FLUX2 = "flux2_dev_fp8mixed.safetensors"
CHECKPOINT_FALLBACK = "flux1-dev-fp8.safetensors"  # Used when FLUX 2 not installed
POLL_INTERVAL_S = 5
MAX_POLL_ATTEMPTS = 480  # 40 minutes max per badge (slow ComfyUI / PuLID)


# ─── Zodiac Badge Definitions ──────────────────────────────────────────────
# Source of Truth: projects/CATBOTICA/metadata/lore_anchors/zodiac_badges.md (LS-CATBOTICA-ANCHOR-012)
# + lore_anchors.md summary. Dog = Master (no PuLID). Remaining 11: PuLID 1.0 + style-lock + unified seed.

PULID_STYLE_LOCK_PREFIX = (
    "Same style as reference: same frame, same colors, same composition. "
    "Only the center subject differs: "
)
UNIFIED_SEED = 2040
# For PuLID runs: lower denoise keeps reference layout/colors stronger (less drift)
DENOISE_PULID = 0.92
# Fixed clip_l for ALL PuLID badges — Catbotica reference look (LS-CATBOTICA-ANCHOR-012)
CLIP_L_PULID_FIXED = (
    "Catbotica zodiac badge, hard-surface mechanical, enamel pin, "
    "Electric Cyan circuitry border, Imperial Red Gold overlay, Carbon Fiber Black"
)

SHARED_NEGATIVE = (
    "fur, hair, feathers, organic skin, organic eyes, realistic animal, photograph, "
    "soft textures, watercolor, oil painting, blurry, low quality, "
    "text, typography, words, letters, numbers, human face, human body, "
    "environmental background, landscape, scenery, multiple objects, cluttered, "
    "asymmetrical, ornate, baroque, busy, heraldic, crest, shield, excessive detail, lavish, fancy, "
    "details at top, ornament above frame, elements outside boundary, "
    "strong glow, harsh glimmer, bright spotlight, artistic, painterly, stylized"
)
# Extra negatives for cute_cartoon variant (avoid menacing look)
SHARED_NEGATIVE_CUTE = (
    "menacing, aggressive, scary, threatening, fierce, angry, sharp teeth, "
    "dark mood, sinister, intimidating, horror, violent"
)
# For cute_cartoon: allow cartoon/chibi; add friendly-avoid negatives
NEGATIVE_CUTE_CARTOON = (
    "fur, hair, feathers, organic skin, organic eyes, realistic animal, photograph, "
    "soft textures, watercolor, oil painting, blurry, low quality, "
    "text, typography, words, letters, numbers, human face, human body, "
    "environmental background, landscape, scenery, multiple objects, cluttered, "
    "asymmetrical, ornate, baroque, busy, heraldic, crest, shield, excessive detail, lavish, fancy, "
    "details at top, ornament above frame, elements outside boundary, "
    "strong glow, harsh glimmer, bright spotlight, artistic, painterly, stylized, "
    + SHARED_NEGATIVE_CUTE
)

# From project_bible.md + lore_anchors/zodiac_badges.md — hybrid palette, mechanical only
DESIGN_SPEC = (
    " Catbotica mechanical style only: plates, wiring, circuit traces, LED accents. "
    "Electric Cyan #00F2FF circuitry traces as border and structural lines. "
    "Imperial Red #C41E3A and Gold #FFD700 for Lunar overlay and Luck-Module glow at center. "
    "Carbon Fiber Black #0D0D0D base. Retro-futuristic enamel pin aesthetic, UE5-quality volumetric lighting. "
    "Round badge frame, subject centered inside. 1:1 square, symmetrical, digital collectible."
)

def _badge_prompt(animal_upper: str) -> str:
    return (
        f"Catbotica zodiac badge. {animal_upper} in hard-surface mechanical style: "
        f"recognizable silhouette with plates, circuit traces, LED accents. "
        f"No organic texture. Enamel pin look, round frame."
        + DESIGN_SPEC
    )


def _badge_prompt_pulid(animal_upper: str) -> str:
    """PuLID runs: same Catbotica look; only animal changes (bible-aligned)."""
    return (
        PULID_STYLE_LOCK_PREFIX
        + f"{animal_upper} in same hard-surface mechanical style, plates and circuit traces, enamel pin, round frame."
        + DESIGN_SPEC
    )


# ─── Cute cartoon variant (draft_label=cute_cartoon): friendlier, like cat robot ───
CUTE_CLIP_L_PULID_FIXED = (
    "Cute cartoon zodiac badge, robot style, hard-surface only, friendly, "
    "Electric Cyan circuitry, Imperial Red Gold, Carbon Fiber Black"
)
CUTE_DESIGN_SPEC = (
    " Cute cartoon style like a friendly robot cat: hard-surface mechanical only, plates, circuit traces, LED accents. "
    "Friendly and approachable, not menacing. Electric Cyan #00F2FF circuitry, Imperial Red #C41E3A and Gold #FFD700 accents, Carbon Fiber Black #0D0D0D. "
    "Round badge frame, subject centered. 1:1 square, symmetrical, enamel pin look, digital collectible."
)


def _cute_badge_prompt(animal_upper: str) -> str:
    """Cute cartoon variant: friendly robot style, hard-surface only."""
    return (
        f"Cute cartoon zodiac badge. {animal_upper} as a friendly robot: hard-surface mechanical only, "
        f"plates, circuit traces, LED accents. Cute and approachable, like a cat robot. Round frame."
        + CUTE_DESIGN_SPEC
    )


def _cute_badge_prompt_pulid(animal_upper: str) -> str:
    """Cute PuLID runs: same friendly robot look; only animal changes."""
    return (
        PULID_STYLE_LOCK_PREFIX
        + f"{animal_upper} as same cute friendly robot, hard-surface only, plates and circuit traces, round frame."
        + CUTE_DESIGN_SPEC
    )


# ─── Sleek metal medallion variant (draft_label=sleek_medallion): refined, abstracted ───
SLEEK_CLIP_L_PULID_FIXED = (
    "Sleek metal medallion, abstract shape, polished round disc, "
    "Electric Cyan and Gold accent lines, dark metal base"
)
SLEEK_DESIGN_SPEC = (
    " Sleek metal medallion: polished metallic surface, round disc with clean beveled edge. "
    "Zodiac as abstract form only: single simplified shape suggesting the animal, reduced to essential gesture. "
    "No literal detail: one minimal contour or silhouette, geometric suggestion. "
    "Thin Electric Cyan #00F2FF and Imperial Red #C41E3A or Gold #FFD700 accent lines only. "
    "Dark metal or Carbon Fiber Black #0D0D0D base. Refined, premium collectible. "
    "1:1 square, centered, symmetrical, subtle Luck-Module glow at center."
)


def _sleek_medallion_badge_prompt(animal_upper: str) -> str:
    """Sleek metal medallion: abstract shape suggesting animal, minimal form."""
    return (
        f"Sleek metal medallion. One abstract shape suggesting {animal_upper}: "
        f"minimal, reduced to essential form, single simplified contour on polished metal disc. "
        f"Round, clean beveled edge, thin Cyan and Gold accent lines, dark metal base."
        + SLEEK_DESIGN_SPEC
    )


def _sleek_medallion_badge_prompt_pulid(animal_upper: str) -> str:
    """Sleek PuLID runs: same medallion; only animal token varies, abstract form."""
    return (
        PULID_STYLE_LOCK_PREFIX
        + f"One abstract shape suggesting {animal_upper}, minimal and reduced to essential form, single contour, round disc, thin Cyan Gold accents."
        + SLEEK_DESIGN_SPEC
    )


# Style references: Horse first (master), Monkey second (PuLID from horse). Rest use PuLID from horse.
# Both horse and monkey define the medallion look; PuLID ref = master_badge_horse.png
# fmt: off
ZODIAC_BADGES = [
    {"name": "horse", "year": 2026, "seed": 2026, "element": "Fire", "is_master": True, "filename_prefix": "catbotica_zodiac/horse", "prompt": _badge_prompt("HORSE")},
    {"name": "monkey", "year": 2028, "seed": 2028, "element": "Earth", "is_master": False, "filename_prefix": "catbotica_zodiac/monkey", "prompt": _badge_prompt("MONKEY")},
    {"name": "dog", "year": 2030, "seed": 2030, "element": "Metal", "is_master": False, "filename_prefix": "catbotica_zodiac/dog", "prompt": _badge_prompt("DOG")},
    {"name": "tiger", "year": 2022, "seed": 2022, "element": "Water", "is_master": False, "filename_prefix": "catbotica_zodiac/tiger", "prompt": _badge_prompt("TIGER")},
    {"name": "rabbit", "year": 2023, "seed": 2023, "element": "Water", "is_master": False, "filename_prefix": "catbotica_zodiac/rabbit", "prompt": _badge_prompt("RABBIT")},
    {"name": "dragon", "year": 2024, "seed": 2024, "element": "Wood", "is_master": False, "filename_prefix": "catbotica_zodiac/dragon", "prompt": _badge_prompt("DRAGON")},
    {"name": "snake", "year": 2025, "seed": 2025, "element": "Wood", "is_master": False, "filename_prefix": "catbotica_zodiac/snake", "prompt": _badge_prompt("SNAKE")},
    {"name": "goat", "year": 2027, "seed": 2027, "element": "Fire", "is_master": False, "filename_prefix": "catbotica_zodiac/goat", "prompt": _badge_prompt("GOAT")},
    {"name": "rooster", "year": 2029, "seed": 2029, "element": "Earth", "is_master": False, "filename_prefix": "catbotica_zodiac/rooster", "prompt": _badge_prompt("ROOSTER")},
    {"name": "pig", "year": 2031, "seed": 2031, "element": "Metal", "is_master": False, "filename_prefix": "catbotica_zodiac/pig", "prompt": _badge_prompt("PIG")},
    {"name": "rat", "year": 2032, "seed": 2032, "element": "Water", "is_master": False, "filename_prefix": "catbotica_zodiac/rat", "prompt": _badge_prompt("RAT")},
    {"name": "ox", "year": 2033, "seed": 2033, "element": "Water", "is_master": False, "filename_prefix": "catbotica_zodiac/ox", "prompt": _badge_prompt("OX")},
]
# fmt: on


# ─── ComfyUI API Helpers ───────────────────────────────────────────────────


def comfyui_health_check() -> bool:
    """Verify ComfyUI is running and responsive."""
    try:
        resp = requests.get(f"{COMFYUI_URL}/system_stats", timeout=5)
        return resp.status_code == 200
    except Exception:
        return False


def queue_prompt(workflow: dict) -> str:
    """
    Queue a workflow prompt on ComfyUI.

    Args:
        workflow: The complete workflow dict (node graph).

    Returns:
        prompt_id from ComfyUI.

    Raises:
        RuntimeError: If ComfyUI rejects the prompt.
    """
    payload = {"prompt": workflow}
    resp = requests.post(f"{COMFYUI_URL}/prompt", json=payload, timeout=30)
    data = resp.json()

    # Check for API-level errors
    if resp.status_code != 200:
        error_msg = data.get("error", {}).get("message", "Unknown error")
        node_errors = data.get("node_errors", {})
        details = []
        for nid, nerr in node_errors.items():
            for e in nerr.get("errors", []):
                details.append(f"  Node {nid} ({nerr.get('class_type', '?')}): {e.get('details', e.get('message', ''))}")
        detail_str = "\n".join(details) if details else "No details"
        raise RuntimeError(
            f"ComfyUI rejected prompt (HTTP {resp.status_code}): {error_msg}\n{detail_str}"
        )

    if "node_errors" in data and data["node_errors"]:
        raise RuntimeError(f"ComfyUI node errors: {json.dumps(data['node_errors'], indent=2)}")

    return data["prompt_id"]


def poll_completion(prompt_id: str) -> dict:
    """
    Poll ComfyUI until prompt completes. Returns the history entry.

    Args:
        prompt_id: The prompt ID to track.

    Returns:
        History dict with outputs.

    Raises:
        TimeoutError: If max poll attempts exceeded.
        RuntimeError: If generation failed.
    """
    for attempt in range(MAX_POLL_ATTEMPTS):
        time.sleep(POLL_INTERVAL_S)
        try:
            resp = requests.get(f"{COMFYUI_URL}/history/{prompt_id}", timeout=10)
            resp.raise_for_status()
            history = resp.json()
        except Exception as e:
            print(f"  [WARN] Poll attempt {attempt + 1} failed: {e}")
            continue

        if prompt_id in history:
            entry = history[prompt_id]
            status = entry.get("status", {})
            if status.get("completed", False):
                if status.get("status_str") == "error":
                    raise RuntimeError(
                        f"Generation failed: {json.dumps(status.get('messages', []), indent=2)}"
                    )
                return entry
    raise TimeoutError(f"Generation did not complete within {MAX_POLL_ATTEMPTS * POLL_INTERVAL_S}s")


def download_image(filename: str, subfolder: str, output_path: Path) -> Path:
    """
    Download a generated image from ComfyUI /view endpoint.

    Args:
        filename: The image filename from history.
        subfolder: The subfolder from history.
        output_path: Where to save locally.

    Returns:
        Path to saved file.
    """
    params = {"filename": filename, "subfolder": subfolder, "type": "output"}
    resp = requests.get(f"{COMFYUI_URL}/view", params=params, timeout=30)
    resp.raise_for_status()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(resp.content)
    return output_path


def upload_image_to_comfyui(local_path: Path, filename: str) -> bool:
    """
    Upload an image to ComfyUI's input directory via the /upload/image endpoint.

    Args:
        local_path: Local image path.
        filename: Target filename in ComfyUI input.

    Returns:
        True if upload succeeded.
    """
    with open(local_path, "rb") as f:
        files = {"image": (filename, f, "image/png")}
        data = {"overwrite": "true"}
        resp = requests.post(f"{COMFYUI_URL}/upload/image", files=files, data=data, timeout=30)
    resp.raise_for_status()
    return True


# ─── Workflow Manipulation ──────────────────────────────────────────────────


def load_base_workflow() -> dict:
    """Load the base workflow JSON (strips _meta keys for API submission)."""
    with open(WORKFLOW_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)

    # Remove top-level _meta (not a node)
    workflow = {k: v for k, v in raw.items() if k != "_meta"}
    return workflow


def build_clip_l_summary(animal_name: str) -> str:
    """Catbotica reference: mechanical, enamel pin, hybrid palette (bible)."""
    return (
        f"Catbotica zodiac badge, {animal_name}, hard-surface mechanical, enamel pin, "
        "Electric Cyan circuitry, Imperial Red Gold, Carbon Fiber Black"
    )


def build_workflow(
    base: dict,
    prompt_text: str,
    seed: int,
    filename_prefix: str,
    use_pulid: bool,
    animal_name: str = "dog",
    master_ref_image: str | None = None,
    clip_l_override: str | None = None,
    negative_override: str | None = None,
    ckpt_name: str | None = None,
) -> dict:
    """
    Build a runnable workflow by swapping prompt, seed, filename, and PuLID state.

    FLUX requires CLIPTextEncodeFlux with dual inputs (clip_l + t5xxl) and cfg=1.0.
    When use_pulid is True, master_ref_image is the ComfyUI input filename for the style reference.
    clip_l_override: when set (e.g. for cute_cartoon variant), use instead of default clip_l.
    negative_override: when set, use for node 7 negative prompt.
    """
    wf = copy.deepcopy(base)

    # FLUX 2 by default; use ckpt_name override (e.g. CHECKPOINT_FALLBACK when --flux1) if provided
    wf["1"]["inputs"]["ckpt_name"] = ckpt_name if ckpt_name else CHECKPOINT_FLUX2

    # Node 6: Positive prompt (FLUX dual encoder)
    if clip_l_override is not None:
        wf["6"]["inputs"]["clip_l"] = clip_l_override
    else:
        wf["6"]["inputs"]["clip_l"] = (
            CLIP_L_PULID_FIXED if use_pulid else build_clip_l_summary(animal_name)
        )
    wf["6"]["inputs"]["t5xxl"] = prompt_text
    wf["6"]["inputs"]["guidance"] = 3.5

    # Node 7: Negative prompt (override for draft variants e.g. cute_cartoon)
    if negative_override is not None and "7" in wf:
        wf["7"]["inputs"]["t5xxl"] = negative_override

    # Node 3: KSampler — seed + cfg=1.0 (FLUX uses internal guidance)
    wf["3"]["inputs"]["seed"] = seed
    wf["3"]["inputs"]["cfg"] = 1.0
    if use_pulid:
        wf["3"]["inputs"]["denoise"] = DENOISE_PULID  # Preserve reference structure

    if use_pulid:
        # PuLID enabled: model from ApplyPulidFlux (node 20), reference image in node 15
        wf["3"]["inputs"]["model"] = ["20", 0]
        if master_ref_image and "15" in wf:
            wf["15"]["inputs"]["image"] = master_ref_image
        # Max style lock: weight 1.0, end_at 1.0 (reference dominates)
        if "20" in wf:
            wf["20"]["inputs"]["weight"] = 1.0
            wf["20"]["inputs"]["end_at"] = 1.0
    else:
        # PuLID bypassed: remove PuLID nodes entirely (10, 11, 12, 15, 20)
        wf["3"]["inputs"]["model"] = ["1", 0]
        for node_id in ["10", "11", "12", "15", "20"]:
            wf.pop(node_id, None)

    # Node 9: SaveImage — filename prefix
    wf["9"]["inputs"]["filename_prefix"] = filename_prefix

    return wf


# ─── VRAM Lock Management ──────────────────────────────────────────────────


def acquire_vram_lock() -> bool:
    """Acquire VRAM lock for Silo 03 via manifest_manager.py."""
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
    """Release VRAM lock for Silo 03."""
    cmd = [
        sys.executable,
        str(SCRIPTS_DIR / "manifest_manager.py"),
        "--silo", SILO_NAME,
        "--status", "IDLE",
        "--vram", "0.0",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout.strip())


# ─── Main Pipeline ─────────────────────────────────────────────────────────


def generate_badge(
    badge: dict,
    base_workflow: dict,
    use_pulid: bool,
    master_ref_image: str | None = None,
    raw_output_dir: Path | None = None,
    draft_label: str | None = None,
    ckpt_name: str | None = None,
) -> Path:
    """
    Generate a single zodiac badge via ComfyUI.

    Args:
        badge: Badge definition dict.
        base_workflow: The base workflow to modify.
        use_pulid: Whether to enable PuLID consistency (reference = master_ref_image).
        master_ref_image: ComfyUI input filename for PuLID reference (e.g. master_badge_horse.png).
        raw_output_dir: Where to save raw PNG (default: RAW_OUTPUT_DIR).
        draft_label: If "cute_cartoon", use cute/friendly prompt set and negative.
        ckpt_name: Override checkpoint (e.g. CHECKPOINT_FALLBACK when --flux1). Default FLUX 2.

    Returns:
        Path to the downloaded raw badge PNG.
    """
    out_dir = raw_output_dir if raw_output_dir is not None else (BADGES_BASE / "raw")
    name = badge["name"]
    output_file = out_dir / f"{name}.png"

    # Check if already generated (resume support)
    if output_file.exists():
        print(f"  [SKIP] {name}.png already exists — skipping")
        return output_file

    is_cute = draft_label == "cute_cartoon"
    is_sleek = draft_label == "sleek_medallion"
    if is_cute:
        prompt_text = _cute_badge_prompt_pulid(badge["name"].upper()) if use_pulid else _cute_badge_prompt(badge["name"].upper())
        clip_l_override = CUTE_CLIP_L_PULID_FIXED if use_pulid else (
            f"Cute cartoon zodiac badge, {badge['name']}, friendly robot, hard-surface, "
            "Electric Cyan circuitry, Imperial Red Gold, Carbon Fiber Black"
        )
        negative_override = NEGATIVE_CUTE_CARTOON
    elif is_sleek:
        prompt_text = _sleek_medallion_badge_prompt_pulid(badge["name"].upper()) if use_pulid else _sleek_medallion_badge_prompt(badge["name"].upper())
        clip_l_override = SLEEK_CLIP_L_PULID_FIXED if use_pulid else (
            f"Sleek metal medallion, {badge['name']}, polished metal disc, "
            "Electric Cyan Gold accents, dark metal base"
        )
        negative_override = None  # use workflow default
    else:
        prompt_text = _badge_prompt_pulid(badge["name"].upper()) if use_pulid else badge["prompt"]
        clip_l_override = None
        negative_override = None

    seed = UNIFIED_SEED
    variant_tag = ", cute_cartoon" if is_cute else (", sleek_medallion" if is_sleek else "")
    print(f"  [GEN] Queuing {name.upper()} (seed={seed}, PuLID={'ON' if use_pulid else 'OFF'}{variant_tag})...")

    wf = build_workflow(
        base=base_workflow,
        prompt_text=prompt_text,
        seed=seed,
        filename_prefix=badge["filename_prefix"],
        use_pulid=use_pulid,
        animal_name=badge["name"],
        master_ref_image=master_ref_image,
        clip_l_override=clip_l_override,
        negative_override=negative_override,
        ckpt_name=ckpt_name,
    )

    # Queue and wait
    prompt_id = queue_prompt(wf)
    print(f"  [WAIT] Prompt ID: {prompt_id} — polling for completion...")

    history = poll_completion(prompt_id)

    # Extract output image info from SaveImage node (node 9)
    outputs = history.get("outputs", {})
    save_node = outputs.get("9", {})
    images = save_node.get("images", [])

    if not images:
        raise RuntimeError(f"No images in output for {name}. History: {json.dumps(outputs, indent=2)}")

    img_info = images[0]
    downloaded = download_image(
        filename=img_info["filename"],
        subfolder=img_info.get("subfolder", ""),
        output_path=output_file,
    )
    print(f"  [OK] Saved: {downloaded}")
    return downloaded


def run_pipeline(args):
    """Execute the full badge generation pipeline."""
    raw_output_dir = get_raw_output_dir(getattr(args, "draft_label", None))
    print("=" * 70)
    print("CATBOTICA ZODIAC BADGE GENERATOR — Silo 03 (Arch Studio)")
    print("Lore Anchor: LS-CATBOTICA-ANCHOR-012")
    print(f"VRAM Estimate: {VRAM_ESTIMATE_GB} GB (FLUX 2 Dev + PuLID)")
    print(f"Output: {raw_output_dir}")
    if getattr(args, "draft_label", None):
        print(f"Draft variant: {args.draft_label}")
    print("=" * 70)

    # ── Step 0: Determine which badges to generate ──
    badges_to_generate = list(ZODIAC_BADGES)  # copy

    if args.only:
        badges_to_generate = [b for b in badges_to_generate if b["name"] == args.only]
        if not badges_to_generate:
            print(f"[ERROR] Unknown badge: {args.only}")
            valid = [b["name"] for b in ZODIAC_BADGES]
            print(f"  Valid names: {', '.join(valid)}")
            return False

    if args.start_from:
        names = [b["name"] for b in badges_to_generate]
        if args.start_from not in names:
            print(f"[ERROR] Unknown badge: {args.start_from}")
            return False
        idx = names.index(args.start_from)
        badges_to_generate = badges_to_generate[idx:]

    print(f"\n[INFO] Generating {len(badges_to_generate)} badge(s): "
          f"{', '.join(b['name'].upper() for b in badges_to_generate)}")

    if args.dry_run:
        print("\n[DRY RUN] Would generate the following:")
        for b in badges_to_generate:
            pulid = "OFF" if b["is_master"] else "ON"
            print(f"  - {b['name'].upper()} (Year {b['year']}, {b['element']}, "
                  f"Seed {b['seed']}, PuLID {pulid})")
        print("\n[DRY RUN] No images generated. Remove --dry-run to execute.")
        return True

    # ── Step 1: Verify ComfyUI ──
    print("\n[1/5] Verifying ComfyUI...")
    if not comfyui_health_check():
        print("[ERROR] ComfyUI not running at {COMFYUI_URL}")
        print("  Start ComfyUI via Stability Matrix, then retry.")
        return False
    print(f"  [OK] ComfyUI responsive at {COMFYUI_URL}")

    # ── Step 2: Acquire VRAM Lock ──
    if not args.skip_lock:
        print(f"\n[2/5] Acquiring VRAM lock ({SILO_NAME}, {VRAM_ESTIMATE_GB}GB)...")
        if not acquire_vram_lock():
            print("[ERROR] Cannot acquire VRAM lock. Check .locks/ for conflicts.")
            return False
    else:
        print("\n[2/5] VRAM lock skipped (--skip-lock)")

    try:
        # ── Step 3: Load base workflow ──
        print("\n[3/5] Loading base workflow...")
        if not WORKFLOW_PATH.exists():
            print(f"[ERROR] Workflow not found: {WORKFLOW_PATH}")
            return False
        base_workflow = load_base_workflow()
        print(f"  [OK] Loaded {len(base_workflow)} nodes from workflow")

        # ── Step 4: Create output directory ──
        raw_output_dir = get_raw_output_dir(getattr(args, "draft_label", None))
        raw_output_dir.mkdir(parents=True, exist_ok=True)
        print(f"  [OK] Output directory: {raw_output_dir}")

        # ── Step 5: Generate badges ──
        draft_label = getattr(args, "draft_label", None)
        use_flux1 = getattr(args, "flux1", False)
        ckpt_override = CHECKPOINT_FALLBACK if use_flux1 else None  # None = use FLUX 2
        if use_flux1:
            print(f"  [CKPT] Using FLUX 1 fallback: {CHECKPOINT_FALLBACK}")
        else:
            print(f"  [CKPT] Using FLUX 2: {CHECKPOINT_FLUX2}")
        # PuLID reference is always the first badge in full order (Horse), so resume works
        master_name = ZODIAC_BADGES[0]["name"] if ZODIAC_BADGES else "horse"
        master_ref_image = f"master_badge_{master_name}.png"
        print("\n[4/5] Generating badges...")
        print(f"  [STYLE ANCHORS] Horse then Monkey; reference: {master_ref_image}")
        if draft_label:
            print(f"  [VARIANT] {draft_label}")
        results = []
        master_path = None

        for i, badge in enumerate(badges_to_generate, 1):
            print(f"\n--- Badge {i}/{len(badges_to_generate)}: {badge['name'].upper()} ---")

            if badge["is_master"]:
                # Master badge: NO PuLID (style anchor)
                print("  [MASTER] Generating WITHOUT PuLID (style anchor for rest)")
                path = generate_badge(
                    badge, base_workflow, use_pulid=False,
                    raw_output_dir=raw_output_dir, draft_label=draft_label,
                    ckpt_name=ckpt_override,
                )
                master_path = path

                # Upload master to ComfyUI input for PuLID reference
                if not path.name.startswith("SKIP"):
                    print(f"  [UPLOAD] Uploading master badge to ComfyUI/input/ as {master_ref_image}...")
                    try:
                        upload_image_to_comfyui(path, master_ref_image)
                        print(f"  [OK] Master badge uploaded as {master_ref_image}")
                    except Exception as e:
                        print(f"  [ERROR] Upload failed: {e}")
                        print("  [FALLBACK] You may need to manually copy to ComfyUI/input/")
            else:
                # Non-master: use PuLID with master as reference (unless --no-pulid)
                use_pulid = not args.no_pulid

                if use_pulid:
                    if master_path is None:
                        master_candidate = raw_output_dir / f"{master_name}.png"
                        if master_candidate.exists():
                            print(f"  [INFO] Using existing master badge ({master_name}.png) for PuLID reference")
                            try:
                                upload_image_to_comfyui(master_candidate, master_ref_image)
                            except Exception:
                                pass
                            master_path = master_candidate
                        else:
                            print(f"  [WARN] Master badge ({master_name}.png) not found — PuLID may be inconsistent")

                path = generate_badge(
                    badge,
                    base_workflow,
                    use_pulid=use_pulid,
                    master_ref_image=master_ref_image if use_pulid else None,
                    raw_output_dir=raw_output_dir,
                    draft_label=draft_label,
                    ckpt_name=ckpt_override,
                )

            results.append({"name": badge["name"], "path": str(path), "success": True})

        # ── Summary ──
        print("\n" + "=" * 70)
        print("[5/5] GENERATION COMPLETE")
        print("=" * 70)
        success_count = sum(1 for r in results if r["success"])
        print(f"  Generated: {success_count}/{len(badges_to_generate)} badges")
        print(f"  Output: {raw_output_dir}")
        print("\n  Files:")
        for r in results:
            status = "OK" if r["success"] else "FAIL"
            print(f"    [{status}] {r['name']}.png")

        print(f"\n[NEXT] Run postprocess_badges.py for Silo 07 (bg removal + upscale)")
        print(f"  python postprocess_badges.py")
        return True

    except Exception as e:
        print(f"\n[FATAL] Pipeline error: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        # Always release VRAM lock
        if not args.skip_lock:
            print(f"\n[CLEANUP] Releasing VRAM lock ({SILO_NAME})...")
            release_vram_lock()


# ─── CLI ────────────────────────────────────────────────────────────────────


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="CATBOTICA Zodiac Badge Generator (Silo 03)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python generate_zodiac_badges.py                    # Generate all 12\n"
            "  python generate_zodiac_badges.py --dry-run           # Preview only\n"
            "  python generate_zodiac_badges.py --start-from tiger  # Resume\n"
            "  python generate_zodiac_badges.py --only horse        # One badge\n"
        ),
    )
    parser.add_argument("--dry-run", action="store_true", help="Preview without generating")
    parser.add_argument("--start-from", type=str, help="Resume from a specific badge name")
    parser.add_argument("--only", type=str, help="Generate only one specific badge")
    parser.add_argument("--skip-lock", action="store_true", help="Skip VRAM lock (dev mode)")
    parser.add_argument("--no-pulid", action="store_true",
                        help="Generate ALL badges without PuLID (use when PuLID model not available)")
    parser.add_argument("--draft-label", type=str, default=None,
                        help="Draft variant: output to raw/<label>/ (e.g. cute_cartoon). Keeps other drafts intact.")
    parser.add_argument("--flux1", action="store_true",
                        help="Use FLUX 1 checkpoint instead of FLUX 2 (if FLUX 2 not installed)")
    args = parser.parse_args()

    success = run_pipeline(args)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
