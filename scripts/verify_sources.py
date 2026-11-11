"""R12 re-verification, step 1 (automatic): does each number an entry states appear in its own sources?

For every entry of a systems file, each source URL is rendered in headless Chrome (PDFs are downloaded and read with
pdftotext) (Playwright; many maker pages are
built by script, and hidden template text must not count, so only the rendered innerText is used) and every number in
the entry's year, resolution and specs is looked for in the combined text. Numbers that are not found are listed for a
person to re-read (step 2); nothing is changed here.

Writes <out>.json (machine-readable) and prints a summary.
Run:  .venv/bin/python scripts/verify_sources.py data/systems/superres.json --out <scratchpad>/verify_superres
"""
import argparse
import json
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

NUM = re.compile(r"\d+(?:[.,]\d+)?")


def numbers(entry: dict) -> list[tuple[str, str]]:
    """(field, number) pairs stated by the entry: year, resolution values and every number in the specs."""
    out = []
    if entry.get("year"):
        out.append(("year", str(entry["year"])))
    for k, v in (entry.get("resolution") or {}).items():
        if k != "note" and isinstance(v, (int, float)):
            out.append((f"resolution.{k}", f"{v:g}"))
    for k, v in (entry.get("specs") or {}).items():
        for n in NUM.findall(str(v)):
            out.append((f"specs.{k}", n.replace(",", "")))
    return out


def norm(text: str) -> str:
    t = text.replace(" ", " ").replace(",", "")
    return t


def present(n: str, text: str) -> bool:
    """n appears as a whole number in text (so '15' does not match '150'); 2.0 also matches 2."""
    pats = {n}
    if "." in n:
        pats.add(n.rstrip("0").rstrip("."))
    return any(re.search(rf"(?<![\d.]){re.escape(p)}(?![\d])", text) for p in pats)


def pdf_text(url: str) -> str:
    """Download a PDF source and return its text (pdftotext), for sources Chrome downloads instead of showing."""
    import subprocess, tempfile, urllib.request
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"})
    with urllib.request.urlopen(req, timeout=60) as r, tempfile.NamedTemporaryFile(suffix=".pdf") as f:
        data = r.read()
        if not data.startswith(b"%PDF"):
            return "__ERROR__ not a PDF"
        f.write(data); f.flush()
        return subprocess.run(["pdftotext", "-layout", f.name, "-"], capture_output=True, text=True, timeout=120).stdout


def render(page, url: str) -> str:
    if url.lower().split("?")[0].endswith(".pdf") or "asset-downloads" in url:
        try:
            return pdf_text(url)
        except Exception as e:  # noqa: BLE001 - fall back to the browser
            pass
    try:
        page.goto(url, timeout=45000, wait_until="domcontentloaded")
        page.wait_for_timeout(2500)
        return page.evaluate("document.body ? document.body.innerText : ''")
    except Exception as e:  # noqa: BLE001 - a download (PDF) is read directly; anything else is reported
        if "Download is starting" in str(e):
            try:
                return pdf_text(url)
            except Exception as e2:  # noqa: BLE001
                return f"__ERROR__ {type(e2).__name__}: {str(e2)[:120]}"
        return f"__ERROR__ {type(e).__name__}: {str(e)[:120]}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--out", required=True)
    ap.add_argument("--only", nargs="*", help="entry ids")
    a = ap.parse_args()
    entries = json.loads(Path(a.file).read_text())
    if a.only:
        entries = [e for e in entries if e["id"] in a.only]
    results = []
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome", headless=True)
        ctx = b.new_context(user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
                            viewport={"width": 1280, "height": 1600})
        page = ctx.new_page()
        for e in entries:
            texts, fetched = [], []
            for s in e.get("sources", []):
                t = render(page, s["url"])
                ok = not t.startswith("__ERROR__") and len(t) > 300
                fetched.append({"url": s["url"], "ok": ok, "chars": len(t), "error": t[:160] if not ok else ""})
                if ok:
                    texts.append(norm(t))
            text = "\n".join(texts)
            nums = numbers(e)
            missing = [(f, n) for f, n in nums if not present(n, text)]
            results.append({"id": e["id"], "name": e["name"], "status": e.get("status"), "numbers": len(nums),
                            "missing": missing, "sources": fetched,
                            "discontinued_words": bool(re.search(r"discontinu(?!ed products)|no longer (available|sold)|end of (sale|life)|obsolete", text, re.I))})
            print(f"{e['id']:40} sources {sum(f['ok'] for f in fetched)}/{len(fetched)}  numbers {len(nums) - len(missing)}/{len(nums)}"
                  + (f"  missing {missing[:4]}" if missing else ""), flush=True)
        b.close()
    Path(a.out + ".json").write_text(json.dumps(results, indent=1))
    full = sum(1 for r in results if r["numbers"] and not r["missing"] and all(f["ok"] for f in r["sources"]))
    print(f"\n{len(results)} entries; {full} with every number found in readable sources; "
          f"{sum(1 for r in results if not any(f['ok'] for f in r['sources']))} with no readable source")


if __name__ == "__main__":
    sys.exit(main())
