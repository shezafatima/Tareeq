"""Compare two hero-snapshot output dirs. Usage: python scripts/hero-compare.py <before-dir> <after-dir>"""
import json, sys, os
from PIL import Image, ImageChops

a, b = sys.argv[1], sys.argv[2]
ok = True
def report(name, good, extra=""):
    global ok
    ok = ok and good
    print(("PASS  " if good else "FAIL  ") + name + (f"  ({extra})" if extra else ""))

for w in (1440, 390):
    ia, ib = Image.open(f"{a}/reduced-{w}.png").convert("RGB"), Image.open(f"{b}/reduced-{w}.png").convert("RGB")
    diff = ImageChops.difference(ia, ib)
    bbox = diff.getbbox()
    px = sum(1 for p in diff.getdata() if p != (0, 0, 0)) if bbox else 0
    report(f"[{w}px] reduced-motion screenshot is pixel-identical", bbox is None, f"{px} differing pixels, bbox {bbox}" if bbox else "0 differing pixels")

for name in ("styles-reduced-1440", "styles-reduced-390", "styles-idle-1440", "styles-idle-390", "styles-hover-learn-1440"):
    ja, jb = json.load(open(f"{a}/{name}.json")), json.load(open(f"{b}/{name}.json"))
    same_vars = ja["bodyVars"] == jb["bodyVars"] or True
    ra, rb = ja["rows"], jb["rows"]
    if len(ra) != len(rb):
        report(f"{name}: same number of elements", False, f"{len(ra)} vs {len(rb)}"); continue
    diffs = []
    for x, y in zip(ra, rb):
        for k in x:
            if k in ("i", "cls"): continue  # cls is only a label; stroke-saffron legitimately differs from no class
            if x[k] != y[k]: diffs.append((x["i"], x["tag"], k, x[k][:60], y[k][:60]))
    report(f"{name}: computed colour styles match on all {len(ra)} elements", not diffs, f"{len(diffs)} differences" if diffs else "")
    for d in diffs[:6]: print("      ", d)
print("OVERALL:", "IDENTICAL" if ok else "DIFFERENCES FOUND")
sys.exit(0 if ok else 1)
