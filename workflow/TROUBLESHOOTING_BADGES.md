# Zodiac Badge Generator — Why It Gets Stuck

## Most likely cause: PuLID + InsightFace on a non-face image

For **badges 2–12** the workflow uses **PuLID** with your **master badge (horse)** as the reference image. PuLID uses **InsightFace** (face analysis). Your reference is a **medallion** — an abstract shape, **not a human face**.

- InsightFace can **hang or run extremely slowly** when it doesn’t find a face (it may keep scanning or retrying).
- That’s why **Horse** (no PuLID) finishes, but **Monkey** (first PuLID run) never completes within 20–40 minutes.

## What to do

### 1. InsightFace on GPU (CUDA) vs CPU

The workflow uses **CUDA** for InsightFace (GPU). If generations hang on the first PuLID badge (e.g. Monkey), InsightFace may be stalling on the non-face reference. You can try **CPU** as a workaround:

- Open the workflow in ComfyUI.
- Find **Load InsightFace (PuLID Flux)** (node 11).
- Change **provider** from **CUDA** to **CPU**, save, then run the generator again (resume from Monkey).

### 2. Check ComfyUI queue and UI

- Open **http://127.0.0.1:8188** (or your ComfyUI URL).
- See if a prompt is **running** (progress bar) or **stuck** (no progress for many minutes).
- If the queue is stuck, **Clear** it and try again after changing InsightFace to CPU.

### 3. Confirm reference image is present

- In ComfyUI **input** folder there must be **master_badge_horse.png** (the Horse badge you generated).
- The script uploads it after Horse; if you run with `--start-from monkey`, it re-uploads from `raw/.../horse.png`. If that file is missing, PuLID will fail or hang.

### 4. Generate without PuLID (no style lock)

If PuLID keeps hanging, you can generate all 12 **without** PuLID (each badge will be independent; style may vary):

```powershell
python -u "projects\CATBOTICA\workflow\generate_zodiac_badges.py" --skip-lock --draft-label sleek_medallion --no-pulid
```

Then run post-process as usual. You lose style consistency but unblock the run.

---

**Summary:** The stall is almost certainly **ApplyPulidFlux** waiting on **InsightFace** analyzing a non-face (medallion) image. Switch InsightFace to **CPU** in the workflow and/or try **--no-pulid** to confirm.

---

## Checkpoint: FLUX 2 vs FLUX 1

- **Default:** The generator uses **FLUX 2** (`flux2_dev_fp8mixed.safetensors`). Ensure that file is in ComfyUI’s `models/checkpoints/`.
- **If you don’t have FLUX 2:** Run with `--flux1` to use FLUX 1 (`flux1-dev-fp8.safetensors`) instead.
