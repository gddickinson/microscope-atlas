"""Accessibility and phone-layout audit of every route in screenshots.py (Playwright + installed Chrome, dev only).

At a phone viewport (390 x 844) each page is checked for:
  * horizontal overflow: the page scrolls sideways, and which elements stick out (content inside a sideways-scrolling
    container such as a wide table's .scroll wrapper is fine);
  * form controls (input, select, textarea) without an accessible name (label[for], wrapping label, aria-label,
    aria-labelledby or title);
  * buttons and links without an accessible name (text, aria-label or title);
  * images without an alt attribute, and canvases without a text alternative (aria-label, role="img" + label, or
    a fallback text);
  * duplicate element ids (break label[for] and aria references);
  * simulations: keyboard use. Tab reaches a slider, and arrow keys change it and the readout or plot.
Writes docs/a11y_report.md and exits 1 if any page has problems. Run with the server up:
  .venv/bin/python scripts/a11y_check.py [--out docs/a11y_report.md] [route ...]
"""
import argparse
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from screenshots import BASE, README  # noqa: E402

AUDIT = r"""() => {
  const W = window.innerWidth, out = {overflow: [], unlabelled: [], noname: [], noalt: 0, canvas: 0, dupids: []};
  const desc = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const scroller = el => { for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p).overflowX; if ((s === 'auto' || s === 'scroll') && p !== document.documentElement && p !== document.body) return true; } return false; };
  out.pageWidth = document.scrollingElement.scrollWidth;
  if (out.pageWidth > W + 1) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > W + 1 && !scroller(el) && getComputedStyle(el).position !== 'fixed') {
        const parentOut = el.parentElement && el.parentElement.getBoundingClientRect().right > W + 1 && !scroller(el.parentElement);
        if (!parentOut) out.overflow.push(desc(el) + ' (' + Math.round(r.right) + 'px)');
      }
    }
  }
  const named = el => (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title') || '').trim();
  for (const el of document.querySelectorAll('input:not([type=hidden]), select, textarea')) {
    const lab = (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || el.closest('label');
    if (!lab && !named(el)) out.unlabelled.push(desc(el));
  }
  for (const el of document.querySelectorAll('button, a[href]')) {
    if (!el.textContent.trim() && !named(el) && !el.querySelector('img[alt]:not([alt=""]), svg title')) out.noname.push(desc(el));
  }
  out.noalt = document.querySelectorAll('img:not([alt])').length;
  out.canvas = [...document.querySelectorAll('canvas')].filter(c => !named(c) && !c.textContent.trim() && !c.closest('[aria-hidden=true]') && c.id !== 'bg').length;
  const ids = {}; for (const el of document.querySelectorAll('[id]')) ids[el.id] = (ids[el.id] || 0) + 1;
  out.dupids = Object.entries(ids).filter(([, n]) => n > 1).map(([k, n]) => `${k}×${n}`);
  return out;
}"""


def keyboard(page):
    """Tab to the first slider of a simulation, press ArrowRight, and check that something visible changed."""
    for _ in range(60):
        page.keyboard.press("Tab")
        if page.evaluate("document.activeElement && document.activeElement.type === 'range'"):
            break
    else:
        return ["keyboard: Tab never reaches a slider"]
    snap = """() => [...document.querySelectorAll('#app canvas')].map(c => { try { return c.toDataURL().length + ':' +
        c.toDataURL().slice(-200); } catch (e) { return ''; } }).join('|') + document.querySelector('#app').innerText"""
    before = page.evaluate(snap)
    for _ in range(5):
        page.keyboard.press("ArrowRight")
    page.wait_for_timeout(600)
    return [] if page.evaluate(snap) != before else ["keyboard: arrow keys on the slider change nothing visible"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="docs/a11y_report.md")
    ap.add_argument("routes", nargs="*")
    a = ap.parse_args()
    todo = [r for r in README if not a.routes or r[0] in a.routes]
    rows, bad = [], 0
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        for name, route, _h, js in todo:
            page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
            page.goto(BASE + route)
            page.wait_for_function("!document.querySelector('#app').textContent.startsWith('Loading')", timeout=15000)
            page.wait_for_timeout(1200)
            if js:
                page.evaluate(f"(async () => {{ {js} }})()")
            r = page.evaluate(AUDIT)
            probs = []
            if route.startswith("sim/"):
                probs += keyboard(page)
            if r["pageWidth"] > 391:
                probs.append(f"page {r['pageWidth']}px wide: " + ", ".join(r["overflow"][:6]))
            for k, lab in (("unlabelled", "unlabelled controls"), ("noname", "unnamed buttons/links"), ("dupids", "duplicate ids")):
                if r[k]:
                    probs.append(f"{len(r[k])} {lab}: " + ", ".join(sorted(set(r[k]))[:6]))
            if r["noalt"]:
                probs.append(f"{r['noalt']} images without alt")
            if r["canvas"]:
                probs.append(f"{r['canvas']} canvases without a text alternative")
            print(f"{name:16} {'; '.join(probs) if probs else 'ok'}", flush=True)
            rows.append((name, route, probs))
            bad += bool(probs)
            page.close()
        browser.close()
    lines = ["# Accessibility and phone-layout audit", "",
             "Generated by `scripts/a11y_check.py` at a 390 x 844 viewport (see the script for the checks).", "",
             f"{len(rows) - bad} of {len(rows)} pages clean.", "", "| Page | Route | Problems |", "|---|---|---|"]
    lines += [f"| {n} | `#/{r}` | {'; '.join(p).replace('|', '/') if p else 'none'} |" for n, r, p in rows]
    Path(a.out).write_text("\n".join(lines) + "\n")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
