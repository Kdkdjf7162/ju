#!/usr/bin/env python3
"""Inline assets/voxel-kit.js into an HTML page so it works as one self-contained file.

The page must contain the marker  <!-- VOXEL_KIT -->  where the kit should go
(after the three.js <script> tag).

    python3 scripts/inline_kit.py my-scene.src.html my-scene.html
    python3 scripts/inline_kit.py src/*.html --out examples/
"""
import argparse, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
KIT = HERE.parent / "assets" / "voxel-kit.js"
MARKER = "<!-- VOXEL_KIT -->"

def inline(src: pathlib.Path, dst: pathlib.Path) -> None:
    html = src.read_text(encoding="utf-8")
    if MARKER not in html:
        sys.exit(f"{src}: marker {MARKER} not found")
    kit = KIT.read_text(encoding="utf-8")
    dst.write_text(html.replace(MARKER, "<script>\n" + kit + "\n</script>"), encoding="utf-8")
    print(f"wrote {dst}")

ap = argparse.ArgumentParser()
ap.add_argument("inputs", nargs="+")
ap.add_argument("--out", help="output folder (when inlining several files)")
a = ap.parse_args()
if a.out:
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    for i in a.inputs:
        p = pathlib.Path(i); inline(p, out / p.name.replace(".src", ""))
elif len(a.inputs) == 2:
    inline(pathlib.Path(a.inputs[0]), pathlib.Path(a.inputs[1]))
else:
    sys.exit("give SRC DST, or several sources with --out FOLDER")
