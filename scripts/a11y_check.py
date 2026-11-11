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
  * text contrast (WCAG 2: 4.5:1, 3:1 for large text) against the composited background colours;
  * simulations: keyboard use. Tab reaches a slider, and arrow keys change it and the readout or plot.
  * optical table and spectra viewer: keyboard selection, moving, rotating; adding, toggling and removing.
Writes docs/a11y_report.md and exits 1 if any page has problems. Run with the server up:
  .venv/bin/python scripts/a11y_check.py [--all] [--out docs/a11y_report.md] [route ...]
(--all adds every technique page and every lab tool.)
"""
import argparse
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from screenshots import BASE, README  # noqa: E402

# pages audited here but not in the README screenshot list
EXTRA = [("optical_table", "table", 0, None)]

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
  // WCAG 2 contrast of text against its composited background (4.5:1, or 3:1 for large text)
  const rgba = c => { const m = c.match(/[\d.]+/g) || [0, 0, 0, 0]; return [+m[0], +m[1], +m[2], m[3] === undefined ? 1 : +m[3]]; };
  const over = (top, bot) => [0, 1, 2].map(i => top[i] * top[3] + bot[i] * (1 - top[3])).concat(1);
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const bgOf = el => { const layers = []; for (let p = el; p; p = p.parentElement) { const b = rgba(getComputedStyle(p).backgroundColor); if (b[3] > 0) layers.push(b); if (b[3] >= 1) break; }
    let c = rgba(getComputedStyle(document.body).backgroundColor); if (c[3] < 1) c = [4, 6, 12, 1];
    for (const l of layers.reverse()) c = over(l, c); return c; };
  const seen = new Set(); out.contrast = [];
  for (const el of document.querySelectorAll('#app *, header *')) {
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.visibility === 'hidden' || el.closest('[aria-hidden=true], svg, .lp, video')) continue;
    if (cs.backgroundClip === 'text' || cs.webkitBackgroundClip === 'text') continue;  // gradient-filled text: colour is the gradient
    let op = 1; for (let p = el; p; p = p.parentElement) op *= +getComputedStyle(p).opacity;
    const bg = bgOf(el), fgc = rgba(cs.color); const fg = over([fgc[0], fgc[1], fgc[2], fgc[3] * op], bg);
    const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize), large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700);
    if (ratio < (large ? 3 : 4.5)) { const key = cs.color + '|' + bg.join(',') + '|' + size;
      if (!seen.has(key)) { seen.add(key); out.contrast.push(`${desc(el)} ${ratio.toFixed(2)}:1 (${cs.color} on rgb(${bg.slice(0, 3).map(Math.round)}), ${size}px) "${el.textContent.trim().slice(0, 30)}"`); } }
  }
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


def tab_to(page, test, limit=120):
    """Press Tab until the JS predicate `test` (on document.activeElement) is true; False if never."""
    for _ in range(limit):
        page.keyboard.press("Tab")
        if page.evaluate(f"(a => {test})(document.activeElement)"):
            return True
    return False


def keyboard_table(page):
    """Optical table: Tab reaches a part and selects it; arrows move it (focus kept); R rotates it."""
    if not tab_to(page, "a && a.classList && a.classList.contains('tb-part')"):
        return ["keyboard: Tab never reaches a part on the optical table"]
    page.wait_for_timeout(300)
    probs = []
    info = "(() => { const a = document.activeElement; return a && a.classList.contains('tb-part') ? [a.dataset.id, a.getAttribute('transform'), a.classList.contains('sel')] : null; })()"
    first = page.evaluate(info)
    if not first[2]:
        probs.append("keyboard: focusing a part does not select it")
    page.keyboard.press("ArrowRight"); page.wait_for_timeout(300)
    moved = page.evaluate(info)
    if not moved or moved[0] != first[0]:
        probs.append("keyboard: focus is lost after moving a part")
    elif moved[1] == first[1]:
        probs.append("keyboard: arrow keys do not move the part")
    page.keyboard.press("r"); page.wait_for_timeout(300)
    rot = page.evaluate(info)
    if not rot or rot[1] == (moved or first)[1]:
        probs.append("keyboard: R does not rotate the part")
    return probs


def keyboard_spectra(page):
    """Spectra viewer: add a dye with the keyboard, toggle a laser with Space, remove the dye with Enter."""
    probs, chips = [], "document.querySelectorAll('#chips [data-rm]').length"
    n0 = page.evaluate(chips)
    if not tab_to(page, "a && a.id === 'addf'"):
        return ["keyboard: Tab never reaches 'Add fluorophore'"]
    page.keyboard.type("al"); page.wait_for_timeout(300)  # type-ahead to a dye: must not add anything yet
    if page.evaluate(chips) != n0:
        probs.append("keyboard: choosing in 'Add fluorophore' adds dyes before the choice is confirmed")
    page.keyboard.press("Enter"); page.wait_for_timeout(400)
    if page.evaluate(chips) != n0 + 1:
        probs.append("keyboard: Enter does not add the chosen fluorophore")
    plot = "document.querySelector('#splot').innerHTML.length"
    page.evaluate("document.querySelector('#lz input').focus()")
    before = page.evaluate(plot)
    page.keyboard.press("Space"); page.wait_for_timeout(300)
    if page.evaluate(plot) == before:
        probs.append("keyboard: Space on a laser checkbox changes nothing")
    n1 = page.evaluate(chips)
    page.evaluate("document.querySelector('#chips [data-rm]').focus()")
    page.keyboard.press("Enter"); page.wait_for_timeout(300)
    if page.evaluate(chips) >= n1:
        probs.append("keyboard: Enter on a dye's ✕ does not remove it")
    return probs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="docs/a11y_report.md")
    ap.add_argument("--all", action="store_true", help="also every technique page and every lab tool")
    ap.add_argument("routes", nargs="*")
    a = ap.parse_args()
    todo = [r for r in README + EXTRA if not a.routes or r[0] in a.routes]
    if a.all:
        import json, re, urllib.request
        techs = json.load(urllib.request.urlopen(BASE.split("#")[0] + "api/techniques"))
        todo += [(f"technique:{t['id']}", f"technique/{t['id']}", 0, None) for t in techs]
        static = Path(__file__).resolve().parents[1] / "atlas" / "web" / "static"
        tools = sorted({m for f in static.glob("lab_*.js") for m in re.findall(r"\{ ?id: '([a-z0-9-]+)', group", f.read_text())})
        todo += [(f"lab:{t}", f"lab/{t}", 0, None) for t in tools]
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
            elif route == "table":
                probs += keyboard_table(page)
            elif route == "spectra":
                probs += keyboard_spectra(page)
            if r["pageWidth"] > 391:
                probs.append(f"page {r['pageWidth']}px wide: " + ", ".join(r["overflow"][:6]))
            for k, lab in (("unlabelled", "unlabelled controls"), ("noname", "unnamed buttons/links"), ("dupids", "duplicate ids")):
                if r[k]:
                    probs.append(f"{len(r[k])} {lab}: " + ", ".join(sorted(set(r[k]))[:6]))
            if r["noalt"]:
                probs.append(f"{r['noalt']} images without alt")
            if r["contrast"]:
                probs.append(f"{len(r['contrast'])} low-contrast text styles: " + "; ".join(r["contrast"][:4]))
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
