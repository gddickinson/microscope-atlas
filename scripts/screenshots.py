"""Screenshot pages of the running app with the installed Google Chrome (Playwright, dev only), and report
console errors. Used for docs/img (README figures) and as a smoke test of every route.

Run with the server up:  .venv/bin/python scripts/screenshots.py [--out docs/img] [route ...]
"""
import argparse
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8010/#/"
# name, route, height, optional JS run before the shot
README = [
    ("home", "", 1250, None),
    ("techniques", "techniques", 1100, None),
    ("technique_tirf", "technique/tirf", 1050, None),
    ("technique_sted", "technique/sted", 1050, None),
    ("sim_psf", "sim/psf", 1000, None),
    ("sim_smlm", "sim/smlm", 1000, "await new Promise(r => setTimeout(r, 6000))"),
    ("sim_tirf", "sim/tirf", 1000, None),
    ("sim_sted", "sim/sted", 950, None),
    ("sim_simk", "sim/simk", 900, None),
    ("sim_noise", "sim/noise", 1000, None),
    ("sim_lightsheet", "sim/lightsheet", 950, None),
    ("systems", "systems", 1100, None),
    ("system_detail", "system/zeiss-lsm-980", 1000, None),
    ("compare", "compare/nikon-n-sim-s,abberior-facility-line,oni-nanoimager,zeiss-elyra-7", 1000, None),
    ("spectra", "spectra", 1000, None),
    ("fluorophores", "fluorophores", 1000, None),
    ("chooser", "chooser", 1000, None),
    ("history", "history", 1000, None),
    ("quiz", "quiz", 900, None),
    ("lab", "lab", 1100, None),
    ("papers", "papers", 1000, None),
    ("community", "community", 1000, None),
    ("gallery", "gallery", 1100, None),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="docs/img")
    ap.add_argument("--base", default=BASE, help="site URL ending in #/, e.g. a static export")
    ap.add_argument("routes", nargs="*", help="route names from the README list (default: all)")
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    todo = [r for r in README if not a.routes or r[0] in a.routes]
    bad = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        for name, route, height, js in todo:
            page = browser.new_page(viewport={"width": 1400, "height": height}, device_scale_factor=1)
            errors = []
            page.on("pageerror", lambda e, errors=errors: errors.append(str(e)))
            page.on("console", lambda m, errors=errors: errors.append(m.text) if m.type == "error" else None)
            page.goto(a.base + route)
            page.wait_for_function("!document.querySelector('#app').textContent.startsWith('Loading')", timeout=15000)
            page.wait_for_timeout(1500)
            if js:
                page.evaluate(f"(async () => {{ {js} }})()")
            text = page.inner_text("#app")
            if "Something went wrong" in text:
                errors.append(text[:200])
            page.screenshot(path=str(out / f"{name}.jpg"), type="jpeg", quality=82)
            print(f"{name:16} {'ERR ' + '; '.join(errors) if errors else 'ok'}")
            bad += bool(errors)
            page.close()
        browser.close()
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
