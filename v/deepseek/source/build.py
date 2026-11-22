#!/usr/bin/env python3
"""Build the self-contained Skybound Capybara HTML from local source and vendor files.

No network access is required. Run from anywhere:

    python source/build.py
"""
from __future__ import annotations

import base64
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
VENDOR = HERE / "vendor"
TEMPLATE = HERE / "template.html"
SCENE = HERE / "scene.js"
THREE = VENDOR / "three.module.min.js"
ORBIT = VENDOR / "OrbitControls.js"
OUTPUT = ROOT / "capybara-airship.html"


def encoded(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("ascii")


def main() -> None:
    required = [TEMPLATE, SCENE, THREE, ORBIT]
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise SystemExit("Missing required file(s):\n  " + "\n  ".join(missing))

    html = TEMPLATE.read_text(encoding="utf-8")
    html = html.replace("__THREE_B64__", encoded(THREE))
    html = html.replace("__ORBIT_B64__", encoded(ORBIT))
    html = html.replace("__SCENE_JS__", SCENE.read_text(encoding="utf-8"))
    OUTPUT.write_text(html, encoding="utf-8")

    print(f"Built: {OUTPUT}")
    print(f"Size:  {OUTPUT.stat().st_size:,} bytes")
    print("Dependencies embedded: Three.js r170 + OrbitControls")


if __name__ == "__main__":
    main()
