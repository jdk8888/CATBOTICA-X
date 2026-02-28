#!/usr/bin/env python3
"""
CATBOTICA Zodiac Badge Generator — Silo 03 (Arch Studio)
=========================================================
Batch generation of 12 zodiac badges via ComfyUI REST API.

Pipeline:
  Phase 1: Generate Horse (Master Badge) WITHOUT PuLID
  Phase 2: Copy master to ComfyUI/input/ for PuLID reference
  Phase 3: Generate remaining 11 badges WITH PuLID consistency

VRAM: ~14GB (FLUX 2 Dev FP8 + PuLID FLUX v0.9.1)
Lore Anchor: LS-CATBOTICA-ANCHOR-012
Output: projects/CATBOTICA/Assets/badges/raw/

Usage:
  python generate_zodiac_badges.py                    # Full run (all 12)
  python generate_zodiac_badges.py --dry-run           # Preview only
  python generate_zodiac_badges.py --start-from tiger  # Resume from tiger
  python generate_zodiac_badges.py --only horse        # Generate one badge
  python generate_zodiac_badges.py --skip-lock         # Skip VRAM lock (dev)
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
RAW_OUTPUT_DIR = PROJECT_ROOT / "Assets" / "badges" / "raw"
SCRIPTS_DIR = STUDIO_ROOT / "Scripts"

COMFYUI_URL = "http://127.0.0.1:8188"
SILO_NAME = "03_Arch_Studio"
VRAM_ESTIMATE_GB = 14.0
POLL_INTERVAL_S = 5
MAX_POLL_ATTEMPTS = 240  # 20 minutes max per badge


# ─── Zodiac Badge Definitions ──────────────────────────────────────────────
# Source of Truth: zodiac_badge_prompts.md (LS-CATBOTICA-ANCHOR-012)
# Horse is generated first as Master Badge (no PuLID).
# Remaining 11 use PuLID referencing the Horse for cross-badge consistency.

SHARED_NEGATIVE = (
    "fur, hair, feathers, organic skin, organic eyes, realistic animal, "
    "photograph, soft textures, watercolor, oil painting, blurry, low quality, "
    "text, typography, words, letters, numbers, human face, human body, "
    "environmental background, landscape, scenery, multiple objects, cluttered, "
    "asymmetrical, cartoon, chibi, anime, sketch, pencil drawing, crayon"
)

# fmt: off
ZODIAC_BADGES = [
    {
        "name": "horse", "year": 2026, "seed": 2026, "element": "Fire",
        "is_master": True, "filename_prefix": "catbotica_zodiac/horse",
        "prompt": (
            "A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. "
            "A cybernetic mechanical HORSE constructed from hard-surface metallic plates, copper wiring, "
            "circuit traces, and LED optical sensors. Rearing dynamic pose, pistons and hydraulic joints "
            "visible at legs and neck, mane rendered as a cascade of fiber-optic cables glowing Electric "
            "Cyan #00F2FF, armored chest plate with exposed circuitry. The badge frame features Electric "
            "Cyan #00F2FF glowing circuitry traces forming structural border lines. Overlaid with Imperial "
            "Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs representing "
            "Fire element — flame and spark motifs in the filigree. A Gold glowing Luck-Module emanates "
            "from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric "
            "lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. Centered, "
            "symmetrical, isolated on solid black background, ultra-fine technical detail, retro-futuristic "
            "cyberpunk, high-end enamel pin, digital collectible."
        ),
    },
    {
        "name": "tiger", "year": 2022, "seed": 2022, "element": "Water",
        "is_master": False, "filename_prefix": "catbotica_zodiac/tiger",
        "prompt": (
            "A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. "
            "A cybernetic mechanical TIGER constructed from hard-surface metallic plates, copper wiring, "
            "circuit traces, and LED optical sensors. Powerful crouching stance, armored plating with "
            "layered pauldron-like shoulder plates, jagged circuit-trace stripes glowing Electric Cyan "
            "#00F2FF across the body. Fangs rendered as polished chrome blades. The badge frame features "
            "Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. Overlaid "
            "with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs "
            "representing Water element — wave motifs in the filigree. A Gold glowing Luck-Module emanates "
            "from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric "
            "lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. Centered, "
            "symmetrical, isolated on solid black background, ultra-fine technical detail, retro-futuristic "
            "cyberpunk, high-end enamel pin, digital collectible."
        ),
    },
    {
        "name": "rabbit", "year": 2023, "seed": 2023, "element": "Water",
        "is_master": False, "filename_prefix": "catbotica_zodiac/rabbit",
        "prompt": (
            "A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. "
            "A cybernetic mechanical RABBIT constructed from hard-surface metallic plates, copper wiring, "
            "circuit traces, and LED optical sensors. Elegant upright pose, elongated radar-dish ears "
            "made of brushed titanium with internal Cyan circuit veins, compact articulated body with "
            "smooth ceramic-white plating. Whiskers rendered as fiber-optic filaments. The badge frame "
            "features Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. "
            "Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar "
            "zodiac glyphs representing Water element — flowing ribbon motifs. A Gold glowing Luck-Module "
            "emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality "
            "volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. "
            "Centered, symmetrical, isolated on solid black background, ultra-fine technical detail, "
            "retro-futuristic cyberpunk, high-end enamel pin, digital collectible."
        ),
    },
    {
        "name": "dragon", "year": 2024, "seed": 2024, "element": "Wood",
        "is_master": False, "filename_prefix": "catbotica_zodiac/dragon",
        "prompt": (
            "A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. "
            "A cybernetic mechanical DRAGON constructed from hard-surface metallic plates, copper wiring, "
            "circuit traces, and LED optical sensors. Coiled serpentine body with overlapping hexagonal "
            "scale-plates, articulated jaw with chrome teeth, swept-back horn antennae made of burnished "
            "copper coils. Wings rendered as deployable solar-panel arrays with Cyan circuit veins. The "
            "badge frame features Electric Cyan #00F2FF glowing circuitry traces forming structural border "
            "lines. Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar "
            "zodiac glyphs representing Wood element — branch and vine motifs in the filigree. A Gold "
            "glowing Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate "
            "base. UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface glow on "
            "circuit traces. Centered, symmetrical, isolated on solid black background, ultra-fine "
            "technical detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible."
        ),
    },
    {
        "name": "snake", "year": 2025, "seed": 2025, "element": "Wood",
        "is_master": False, "filename_prefix": "catbotica_zodiac/snake",
        "prompt": (
            "A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. "
            "A cybernetic mechanical SNAKE constructed from hard-surface metallic plates, copper wiring, "
            "circuit traces, and LED optical sensors. Coiled spiral body made of interlocking segmented "
            "rings with visible ball-joint articulation, smooth matte obsidian plating with Cyan circuit "
            "traces running along the spine. Hooded cobra-like head with LED sensor eyes and a forked "
            "antenna tongue. The badge frame features Electric Cyan #00F2FF glowing circuitry traces "
            "forming structural border lines. Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate "
            "filigree patterns and Lunar zodiac glyphs representing Wood element — leaf and tendril motifs. "
            "A Gold glowing Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D "
            "substrate base. UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface "
            "glow on circuit traces. Centered, symmetrical, isolated on solid black background, ultra-fine "
            "technical detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible."
        ),
    },
    {
        "name": "goat", "year": 2027, "seed": 2027, "element": "Fire",
        "is_master": False, "filename_prefix": "catbotica_zodiac/goat",
        "prompt": (
            "A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. "
            "A cybernetic mechanical GOAT constructed from hard-surface metallic plates, copper wiring, "
            "circuit traces, and LED optical sensors. Regal standing pose, curved spiral horns made of "
            "layered copper coil windings with Cyan LED tips, compact muscular frame with angular armor "
            "plating, cloven hooves rendered as magnetic stabilizer pads. The badge frame features "
            "Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. Overlaid "
            "with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs "
            "representing Fire element — ember and warmth motifs. A Gold glowing Luck-Module emanates "
            "from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric "
            "lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. Centered, "
            "symmetrical, isolated on solid black background, ultra-fine technical detail, retro-futuristic "
            "cyberpunk, high-end enamel pin, digital collectible."
        ),
    },
    {
        "name": "monkey", "year": 2028, "seed": 2028, "element": "Earth",
        "is_master": False, "filename_prefix": "catbotica_zodiac/monkey",
        "prompt": (
            "A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. "
            "A cybernetic mechanical MONKEY constructed from hard-surface metallic plates, copper wiring, "
            "circuit traces, and LED optical sensors. Crouching agile pose with one articulated hand "
            "reaching upward, prehensile tail rendered as a segmented cable with magnetic grapple tip, "
            "expressive LED visor face, compact nimble frame with exposed servo motors at joints. The "
            "badge frame features Electric Cyan #00F2FF glowing circuitry traces forming structural "
            "border lines. Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns "
            "and Lunar zodiac glyphs representing Earth element — stone and crystal motifs. A Gold glowing "
            "Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate base. "
            "UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit "
            "traces. Centered, symmetrical, isolated on solid black background, ultra-fine technical "
            "detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible."
        ),
    },
    {
        "name": "rooster", "year": 2029, "seed": 2029, "element": "Earth",
        "is_master": False, "filename_prefix": "catbotica_zodiac/rooster",
        "prompt": (
            "A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. "
            "A cybernetic mechanical ROOSTER constructed from hard-surface metallic plates, copper wiring, "
            "circuit traces, and LED optical sensors. Proud upright stance, dramatic crest/comb rendered "
            "as a radiator fin array glowing Imperial Red, tail feathers rendered as deployable antenna "
            "blade fans with Cyan circuit traces, sharp talons as precision tool-tips. The badge frame "
            "features Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. "
            "Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar "
            "zodiac glyphs representing Earth element — geometric crystal motifs. A Gold glowing "
            "Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate base. "
            "UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit "
            "traces. Centered, symmetrical, isolated on solid black background, ultra-fine technical "
            "detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible."
        ),
    },
    {
        "name": "dog", "year": 2030, "seed": 2030, "element": "Metal",
        "is_master": False, "filename_prefix": "catbotica_zodiac/dog",
        "prompt": (
            "A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. "
            "A cybernetic mechanical DOG constructed from hard-surface metallic plates, copper wiring, "
            "circuit traces, and LED optical sensors. Alert sitting pose with ears perked, radar-dish "
            "ears with internal antenna arrays, broad loyal chest plate with shield-like armor, articulated "
            "tail functioning as a balance gyroscope, muzzle with sensor grid. The badge frame features "
            "Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. Overlaid "
            "with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs "
            "representing Metal element — forged steel and riveted motifs. A Gold glowing Luck-Module "
            "emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality "
            "volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. "
            "Centered, symmetrical, isolated on solid black background, ultra-fine technical detail, "
            "retro-futuristic cyberpunk, high-end enamel pin, digital collectible."
        ),
    },
    {
        "name": "pig", "year": 2031, "seed": 2031, "element": "Metal",
        "is_master": False, "filename_prefix": "catbotica_zodiac/pig",
        "prompt": (
            "A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. "
            "A cybernetic mechanical PIG constructed from hard-surface metallic plates, copper wiring, "
            "circuit traces, and LED optical sensors. Sturdy seated pose with a round compact body of "
            "overlapping armor plates, broad snout with dual intake vents and sensor array, small "
            "articulated ears like satellite dishes, curly tail rendered as a coiled power conduit with "
            "Cyan glow. The badge frame features Electric Cyan #00F2FF glowing circuitry traces forming "
            "structural border lines. Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree "
            "patterns and Lunar zodiac glyphs representing Metal element — hammered bronze and gilt motifs. "
            "A Gold glowing Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D "
            "substrate base. UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface "
            "glow on circuit traces. Centered, symmetrical, isolated on solid black background, ultra-fine "
            "technical detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible."
        ),
    },
    {
        "name": "rat", "year": 2032, "seed": 2032, "element": "Water",
        "is_master": False, "filename_prefix": "catbotica_zodiac/rat",
        "prompt": (
            "A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. "
            "A cybernetic mechanical RAT constructed from hard-surface metallic plates, copper wiring, "
            "circuit traces, and LED optical sensors. Alert crouching pose with oversized round "
            "sensor-ear dishes, long segmented tail made of linked micro-servos, compact agile body with "
            "sleek low-profile armor, tiny articulated claws with tool-tip digits, sharp pointed snout "
            "with whisker-like fiber-optic probes. The badge frame features Electric Cyan #00F2FF glowing "
            "circuitry traces forming structural border lines. Overlaid with Imperial Red #C41E3A and "
            "Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs representing Water element — "
            "ripple and current motifs. A Gold glowing Luck-Module emanates from the forehead region. "
            "Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric lighting, 3D beveled "
            "metallic surfaces, subsurface glow on circuit traces. Centered, symmetrical, isolated on "
            "solid black background, ultra-fine technical detail, retro-futuristic cyberpunk, high-end "
            "enamel pin, digital collectible."
        ),
    },
    {
        "name": "ox", "year": 2033, "seed": 2033, "element": "Water",
        "is_master": False, "filename_prefix": "catbotica_zodiac/ox",
        "prompt": (
            "A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. "
            "A cybernetic mechanical OX constructed from hard-surface metallic plates, copper wiring, "
            "circuit traces, and LED optical sensors. Powerful front-facing stance, massive horns rendered "
            "as twin hydraulic rams with Cyan-lit pressure gauges, broad reinforced chest plate with "
            "hexagonal bolt patterns, thick armored legs with heavy-duty piston joints, a nose ring "
            "rendered as a glowing data-link torus. The badge frame features Electric Cyan #00F2FF glowing "
            "circuitry traces forming structural border lines. Overlaid with Imperial Red #C41E3A and "
            "Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs representing Water element — "
            "deep ocean and tide motifs. A Gold glowing Luck-Module emanates from the forehead region. "
            "Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric lighting, 3D beveled "
            "metallic surfaces, subsurface glow on circuit traces. Centered, symmetrical, isolated on "
            "solid black background, ultra-fine technical detail, retro-futuristic cyberpunk, high-end "
            "enamel pin, digital collectible."
        ),
    },
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
    """Build a short CLIP-L summary prompt for FLUX dual encoder."""
    return (
        f"Cybernetic mechanical {animal_name} badge, retro-futuristic enamel pin, "
        f"Electric Cyan circuitry, Imperial Red and Gold filigree, "
        f"Carbon Fiber Black base, digital collectible"
    )


def build_workflow(
    base: dict,
    prompt_text: str,
    seed: int,
    filename_prefix: str,
    use_pulid: bool,
    animal_name: str = "horse",
) -> dict:
    """
    Build a runnable workflow by swapping prompt, seed, filename, and PuLID state.

    FLUX requires CLIPTextEncodeFlux with dual inputs (clip_l + t5xxl) and cfg=1.0.
    Guidance is handled internally by FLUX via the guidance parameter (3.5).

    Args:
        base: The base workflow dict.
        prompt_text: Full positive prompt (goes into t5xxl field).
        seed: Random seed for KSampler.
        filename_prefix: SaveImage filename prefix.
        use_pulid: If False, strip PuLID nodes entirely and connect KSampler to checkpoint.
        animal_name: Animal name for the clip_l short summary.

    Returns:
        Modified workflow dict ready for API submission.
    """
    wf = copy.deepcopy(base)

    # Fix checkpoint name to match available model
    wf["1"]["inputs"]["ckpt_name"] = "flux1-dev-fp8.safetensors"

    # Node 6: Positive prompt (FLUX dual encoder)
    wf["6"]["inputs"]["clip_l"] = build_clip_l_summary(animal_name)
    wf["6"]["inputs"]["t5xxl"] = prompt_text
    wf["6"]["inputs"]["guidance"] = 3.5

    # Node 3: KSampler — seed + cfg=1.0 (FLUX uses internal guidance)
    wf["3"]["inputs"]["seed"] = seed
    wf["3"]["inputs"]["cfg"] = 1.0

    if use_pulid:
        # PuLID enabled: model from ApplyPulidFlux (node 20)
        wf["3"]["inputs"]["model"] = ["20", 0]
    else:
        # PuLID bypassed: remove PuLID nodes entirely (10, 11, 12, 15, 20)
        # and connect KSampler directly to checkpoint (node 1)
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


def generate_badge(badge: dict, base_workflow: dict, use_pulid: bool) -> Path:
    """
    Generate a single zodiac badge via ComfyUI.

    Args:
        badge: Badge definition dict.
        base_workflow: The base workflow to modify.
        use_pulid: Whether to enable PuLID consistency.

    Returns:
        Path to the downloaded raw badge PNG.
    """
    name = badge["name"]
    output_file = RAW_OUTPUT_DIR / f"{name}.png"

    # Check if already generated (resume support)
    if output_file.exists():
        print(f"  [SKIP] {name}.png already exists — skipping")
        return output_file

    print(f"  [GEN] Queuing {name.upper()} (seed={badge['seed']}, PuLID={'ON' if use_pulid else 'OFF'})...")

    wf = build_workflow(
        base=base_workflow,
        prompt_text=badge["prompt"],
        seed=badge["seed"],
        filename_prefix=badge["filename_prefix"],
        use_pulid=use_pulid,
        animal_name=badge["name"],
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
    print("=" * 70)
    print("CATBOTICA ZODIAC BADGE GENERATOR — Silo 03 (Arch Studio)")
    print("Lore Anchor: LS-CATBOTICA-ANCHOR-012")
    print(f"VRAM Estimate: {VRAM_ESTIMATE_GB} GB (FLUX 2 Dev + PuLID)")
    print(f"Output: {RAW_OUTPUT_DIR}")
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
        RAW_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        print(f"  [OK] Output directory: {RAW_OUTPUT_DIR}")

        # ── Step 5: Generate badges ──
        print("\n[4/5] Generating badges...")
        results = []
        master_path = None

        for i, badge in enumerate(badges_to_generate, 1):
            print(f"\n--- Badge {i}/{len(badges_to_generate)}: {badge['name'].upper()} ---")

            if badge["is_master"]:
                # Master badge: NO PuLID
                print("  [MASTER] Generating WITHOUT PuLID (identity anchor)")
                path = generate_badge(badge, base_workflow, use_pulid=False)
                master_path = path

                # Upload master to ComfyUI input for PuLID reference
                if not path.name.startswith("SKIP"):
                    print("  [UPLOAD] Uploading master badge to ComfyUI/input/...")
                    try:
                        upload_image_to_comfyui(path, "master_badge_horse.png")
                        print("  [OK] Master badge uploaded as master_badge_horse.png")
                    except Exception as e:
                        print(f"  [ERROR] Upload failed: {e}")
                        print("  [FALLBACK] You may need to manually copy to ComfyUI/input/")
            else:
                # Determine PuLID usage
                use_pulid = not args.no_pulid

                if use_pulid:
                    # Check that master badge exists for PuLID reference
                    if master_path is None:
                        master_candidate = RAW_OUTPUT_DIR / "horse.png"
                        if master_candidate.exists():
                            print("  [INFO] Using existing master badge for PuLID reference")
                            try:
                                upload_image_to_comfyui(master_candidate, "master_badge_horse.png")
                            except Exception:
                                pass  # May already be uploaded
                            master_path = master_candidate
                        else:
                            print("  [WARN] Master badge (horse) not found — PuLID may produce inconsistent results")

                path = generate_badge(badge, base_workflow, use_pulid=use_pulid)

            results.append({"name": badge["name"], "path": str(path), "success": True})

        # ── Summary ──
        print("\n" + "=" * 70)
        print("[5/5] GENERATION COMPLETE")
        print("=" * 70)
        success_count = sum(1 for r in results if r["success"])
        print(f"  Generated: {success_count}/{len(badges_to_generate)} badges")
        print(f"  Output: {RAW_OUTPUT_DIR}")
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
    args = parser.parse_args()

    success = run_pipeline(args)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
