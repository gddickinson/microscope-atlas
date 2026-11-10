"""Download the curated Wikimedia Commons images in scripts/content/images_src.py to data/images/.

For every entry it asks the Commons API for the file's metadata, re-checks the licence (public domain, CC0,
CC BY or CC BY-SA only), downloads a thumbnail at most 1000 px wide, re-encodes large files as JPEG (Pillow),
and writes data/images/manifest.json with author, licence and source for each image. Files already present are
kept unless --force is given; files no longer in the list are deleted.

Run: .venv/bin/python scripts/fetch_commons.py [--force]
"""
import html
import io
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "images"
sys.path.insert(0, str(ROOT / "scripts" / "content"))
from images_src import IMAGES as _IMAGES  # noqa: E402
from cell_images_src import CELL_IMAGES  # noqa: E402
from cell_images_src2 import CELL_IMAGES2  # noqa: E402
from calcium_images_src import CALCIUM_IMAGES  # noqa: E402
sys.path.insert(0, str(Path(__file__).resolve().parent))
from commons_video import to_mp4  # noqa: E402

def _merge(base, cells):
    """Instruments and micrographs, then the Cells-page database; a Commons file already listed gains a cell_type."""
    by = {i["commons_title"]: i for i in base}
    out = [dict(i) for i in base]
    idx = {i["commons_title"]: k for k, i in enumerate(out)}
    for c in cells:
        if c["commons_title"] in by:
            out[idx[c["commons_title"]]].setdefault("cell_type", c["cell_type"])
        else:
            out.append(c)
    return out


IMAGES = _merge(_IMAGES, CELL_IMAGES + [{**c, "small": True} for c in CELL_IMAGES2]) + [{**c, "topic": "calcium"} for c in CALCIUM_IMAGES]

API = "https://commons.wikimedia.org/w/api.php"
UA = "microscope-atlas/0.3 (https://github.com/gddickinson/microscope-atlas)"
MAX_W = 1000
MAX_BYTES = 400_000
# Cell-database images added for the identifier (flag `small`) are stored smaller: the model sees 224 px anyway.
SMALL_W, SMALL_BYTES = 720, 160_000
PAUSE = 0.25

try:
    from PIL import Image
except ImportError:  # Pillow is optional: without it files are saved as served
    Image = None

ACCEPT = re.compile(r"^(public domain|pd([- ].*)?|cc0( 1\.0)?|cc[- ]by(-sa)?([- ]\d(\.\d)?)?([- ][a-z]{2,3})?)$", re.I)


def accepted_licence(short, url):
    """Return a normalised licence name if allowed, else None (rejects NC, ND, GFDL-only and unclear)."""
    s = (short or "").strip()
    if not s or re.search(r"\b(nc|nd)\b|non-?commercial|no-?deriv|fair use", s, re.I):
        return None
    if not ACCEPT.match(s):
        return None
    if s.lower().startswith("cc") and "creativecommons.org" not in (url or "") and "cc0" not in s.lower():
        return None  # a CC licence must come with its deed URL
    return s


def strip_html(text):
    text = re.sub(r"<[^>]+>", " ", text or "")
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                data = r.read()
            time.sleep(PAUSE)
            return data if binary else json.loads(data)
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < 3:
                time.sleep(5 * (attempt + 1))
                continue
            raise


def query(titles):
    """Metadata for up to 20 titles, keyed by the title as given (follows normalisation and redirects)."""
    params = {"action": "query", "format": "json", "formatversion": "2", "redirects": "1",
              "titles": "|".join(titles), "prop": "imageinfo", "iiprop": "url|extmetadata|size|mime",
              "iiurlwidth": str(MAX_W)}
    d = get(API + "?" + urllib.parse.urlencode(params))["query"]
    alias = {}
    for key in ("normalized", "redirects"):
        for m in d.get(key, []):
            alias[m["to"]] = alias.get(m["from"], m["from"])
    out = {}
    for p in d.get("pages", []):
        out[alias.get(p["title"], p["title"])] = p
    return out


def slug(title):
    name = title.split(":", 1)[1].rsplit(".", 1)[0]
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s[:70].rstrip("-") or "image"


def to_jpeg(data, mime, max_w=MAX_W, max_bytes=MAX_BYTES):
    """Re-encode as JPEG when the file is big or not a JPEG/PNG (needs Pillow). Returns (bytes, ext, w, h)."""
    im = Image.open(io.BytesIO(data))
    w, h = im.size
    small_ok = mime in ("image/jpeg", "image/png") and len(data) <= max_bytes and w <= max_w
    if small_ok:
        return data, ("jpg" if mime == "image/jpeg" else "png"), w, h
    im.seek(0)
    if w > max_w:
        im = im.resize((max_w, round(h * max_w / w)), Image.LANCZOS)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, "white")
        bg.paste(im, mask=im.split()[-1])
        im = bg
    elif im.mode != "RGB":
        im = im.convert("RGB")
    for q in (85, 78, 70, 62, 54, 46):
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=q, optimize=True, progressive=True)
        if buf.tell() <= max_bytes:
            break
    return buf.getvalue(), "jpg", im.size[0], im.size[1]


def clean_author(artist, credit):
    """Readable author from extmetadata Artist (or Credit); never a bare URL."""
    a = re.split(r"\s+(?:Author info|Consent note)\b", strip_html(artist))[0]
    a = re.sub(r"\s+", " ", re.sub(r"^Authors of the study:|https?://\S+", "", a)).strip(" ,;")
    half = a[: len(a) // 2].strip()
    if half and a == f"{half} {half}":
        a = half  # "Unknown author Unknown author"
    if len(a) > 120:  # long author lists: keep the first names
        a = a[:100].rsplit(",", 1)[0] + " et al."
    if a:
        return a
    c = strip_html(credit)
    if not c or c.lower() == "own work":
        return ""
    url = re.match(r"https?://([^/\s]+)", c)
    return f"Not named (source: {url.group(1)})" if url else c[:120]


def entry_record(item, page):
    info = page["imageinfo"][0]
    meta = {k: v.get("value", "") for k, v in info.get("extmetadata", {}).items()}
    lic = accepted_licence(meta.get("LicenseShortName"), meta.get("LicenseUrl"))
    if not lic:
        return None, f"licence not accepted: {meta.get('LicenseShortName')!r}"
    author = clean_author(meta.get("Artist"), meta.get("Credit"))
    if not author:
        return None, "no author or credit"
    return {"author": author, "licence": lic, "licence_url": meta.get("LicenseUrl", ""),
            "source_url": meta.get("DescriptionUrl") or info.get("descriptionurl", "")}, None


def main(force=False):
    OUT.mkdir(parents=True, exist_ok=True)
    old = {}
    mpath = OUT / "manifest.json"
    if mpath.exists():
        old = {m["commons_title"]: m for m in json.loads(mpath.read_text())}
    manifest, problems, used = [], [], set()
    titles = [i["commons_title"] for i in IMAGES]
    pages = {}
    for k in range(0, len(titles), 20):
        pages.update(query(titles[k:k + 20]))
    for item in IMAGES:
        t = item["commons_title"]
        page = pages.get(t)
        if not page or page.get("missing") or not page.get("imageinfo"):
            problems.append(f"{t}: not found on Commons")
            continue
        rec, err = entry_record(item, page)
        if err:
            problems.append(f"{t}: {err}")
            continue
        info = page["imageinfo"][0]
        base = slug(t)
        while base in used:
            base += "-2"
        used.add(base)
        prev = old.get(t)
        want_video = bool(item.get("topic")) and (info.get("mime", "").startswith("video/") or info.get("mime") in ("application/ogg", "image/gif"))
        if prev and not force and (OUT / prev["file"]).exists() and prev["file"].rsplit(".", 1)[0] == base \
                and prev["file"].endswith(".mp4") == want_video:
            fname, w, h = prev["file"], prev["width"], prev["height"]
        elif want_video:
            fname = f"{base}.mp4"
            w, h = to_mp4(get(info["url"], binary=True), OUT / fname)
            print(f"saved {fname} ({(OUT / fname).stat().st_size // 1024} KB) + poster")
        else:
            url = info.get("thumburl") or info["url"]
            data = get(url, binary=True)
            mime = info.get("thumbmime") or info.get("mime", "")
            if Image is not None:
                data, ext, w, h = to_jpeg(data, mime, *((SMALL_W, SMALL_BYTES) if item.get("small") else ()))
            else:
                ext = url.rsplit(".", 1)[-1].lower()
                w, h = info.get("thumbwidth", info["width"]), info.get("thumbheight", info["height"])
            fname = f"{base}.{ext}"
            (OUT / fname).write_bytes(data)
            print(f"saved {fname} ({len(data) // 1024} KB)")
        manifest.append({"file": fname, "commons_title": t, "kind": item["kind"], "system": item["system"],
                         "techniques": item["techniques"], "title": item["title"], "caption": item["caption"],
                         **({"cell_type": item["cell_type"]} if item.get("cell_type") else {}),
                         **({"topic": item["topic"]} if item.get("topic") else {}),
                         **({"video": True, "poster": fname.replace(".mp4", "_poster.jpg")} if fname.endswith(".mp4") else {}),
                         **rec, "width": w, "height": h})
    keep = {m["file"] for m in manifest} | {m["poster"] for m in manifest if m.get("poster")} | {"manifest.json"}
    for f in OUT.iterdir():
        if f.name not in keep:
            f.unlink()
            print(f"removed stale {f.name}")
    mpath.write_text("[\n" + ",\n".join(json.dumps(m, ensure_ascii=False) for m in manifest) + "\n]\n")
    total = sum(f.stat().st_size for f in OUT.iterdir())
    print(f"\n{len(manifest)} images, {total / 1e6:.1f} MB in {OUT.relative_to(ROOT)}")
    if problems:
        print(f"{len(problems)} skipped:")
        for p in problems:
            print("  -", p)


if __name__ == "__main__":
    main(force="--force" in sys.argv)
