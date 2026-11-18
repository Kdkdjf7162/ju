#!/usr/bin/env python3
"""Frame-exact render of a voxel scene to PNG frames and a video.

Every frame is advanced by exactly 1/fps of scene time, so the result is smooth
no matter how slow the machine is (no dropped frames, unlike screen recording).

Setup (once):
    pip install playwright && python3 -m playwright install chromium
    # plus ffmpeg on PATH for the video step (brew install ffmpeg / apt install ffmpeg)

Examples:
    python3 scripts/render.py examples/house-builder.html --seconds 12 --out house.mov
    python3 scripts/render.py examples/melting-crystal.html --seconds 20 --alpha --out crystal.mov
    python3 scripts/render.py my-scene.html --size 1080x1920 --fps 60 --warmup 3 --out short.mp4

Output by extension: .mov -> ProRes 422 HQ (ProRes 4444 with --alpha, keeps transparency
for editing apps), .mp4 -> H.264, .webm -> VP9 (alpha kept), a folder name -> PNG frames only.
"""
import argparse, base64, pathlib, shutil, subprocess, sys, tempfile

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("html")
    ap.add_argument("--out", default="render.mov")
    ap.add_argument("--seconds", type=float, default=10)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--size", default="1920x1080", help="WIDTHxHEIGHT, e.g. 1080x1920 for vertical")
    ap.add_argument("--alpha", action="store_true", help="transparent background (no sky)")
    ap.add_argument("--warmup", type=float, default=0, help="scene seconds to skip before recording")
    ap.add_argument("--params", default="", help="extra URL params, e.g. 'seed=3&night'")
    ap.add_argument("--keep-frames", action="store_true")
    ap.add_argument("--headed", action="store_true", help="show the browser (uses the real GPU on most machines)")
    a = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit("playwright missing: pip install playwright && python3 -m playwright install chromium")

    w, h = (int(v) for v in a.size.lower().split("x"))
    page_path = pathlib.Path(a.html).resolve()
    q = f"capture&clean&fps={a.fps}" + ("&alpha" if a.alpha else "") + (f"&{a.params}" if a.params else "")
    url = page_path.as_uri() + "?" + q

    out = pathlib.Path(a.out)
    frames_only = out.suffix == ""
    frames = out if frames_only else pathlib.Path(tempfile.mkdtemp(prefix="voxel-frames-"))
    frames.mkdir(parents=True, exist_ok=True)
    n = round(a.seconds * a.fps)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not a.headed,
                                    args=["--ignore-gpu-blocklist", "--enable-unsafe-swiftshader", "--use-gl=angle"])
        page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(url)
        try:
            page.wait_for_function("window.__vk && window.__vk.ready", timeout=30000)
        except Exception:
            sys.exit("scene did not start in capture mode. Page errors: " + "; ".join(errors))
        if a.warmup:
            page.evaluate(f"__vk.frame({round(a.warmup * a.fps)})")
        for i in range(n):
            data = page.evaluate("() => { __vk.frame(); return document.querySelector('canvas').toDataURL('image/png'); }")
            (frames / f"{i:05d}.png").write_bytes(base64.b64decode(data.split(",", 1)[1]))
            if i % a.fps == 0:
                print(f"\rframe {i}/{n}", end="", flush=True)
        browser.close()
    print(f"\rframe {n}/{n}")
    if errors:
        print("page errors:", *errors, sep="\n  ")
    if frames_only:
        print(f"PNG frames in {frames}/")
        return

    if not shutil.which("ffmpeg"):
        print(f"ffmpeg not found: frames kept in {frames}/"); return
    ext = out.suffix.lower()
    if ext == ".mov":
        codec = ["-c:v", "prores_ks", "-profile:v", "4" if a.alpha else "3", "-pix_fmt", "yuva444p10le" if a.alpha else "yuv422p10le"]
    elif ext == ".webm":
        codec = ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "24", "-pix_fmt", "yuva420p" if a.alpha else "yuv420p"]
    else:
        if a.alpha: print("note: .mp4 has no alpha channel, use .mov or .webm to keep transparency")
        codec = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p"]
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(a.fps), "-i", str(frames / "%05d.png"), *codec, str(out)], check=True)
    print(f"wrote {out}")
    if not a.keep_frames:
        shutil.rmtree(frames, ignore_errors=True)

if __name__ == "__main__":
    main()
