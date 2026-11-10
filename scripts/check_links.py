"""Check external links: community resources (default) or system sources (--systems). Writes a report to
docs/link_report.md and exits 1 if any community link fails.

Run: .venv/bin/python scripts/check_links.py [--systems]
"""
import json
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = {"User-Agent": "Mozilla/5.0 (Macintosh) microscope-atlas link check"}


def status(url: str) -> str:
    url = urllib.parse.quote(url, safe=":/?#[]@!$&'()*+,;=%~")  # encode spaces and non-ASCII characters
    for method in ("HEAD", "GET"):
        try:
            req = urllib.request.Request(url, headers=UA, method=method)
            with urllib.request.urlopen(req, timeout=20) as r:
                return str(r.status)
        except urllib.error.HTTPError as e:
            if method == "GET" or e.code not in (403, 405, 400, 429):
                return str(e.code)
        except Exception as e:  # noqa: BLE001
            if method == "GET":
                return type(e).__name__
    return "?"


def main():
    if "--systems" in sys.argv:
        urls = sorted({s["url"] for f in (ROOT / "data" / "systems").glob("*.json") for x in json.loads(f.read_text()) for s in x["sources"]})
    else:
        sys.path.insert(0, str(ROOT / "scripts" / "content"))
        from community_src import COMMUNITY
        from videos_src import VIDEOS
        urls = [u for _, rows in COMMUNITY for _, u, _ in rows] + [v["url"] for v in VIDEOS]
    with ThreadPoolExecutor(12) as ex:
        res = dict(zip(urls, ex.map(status, urls)))
    bad = {u: s for u, s in res.items() if not s.startswith(("2", "3"))}
    blocked = {u for u, s in bad.items() if s in ("403", "429")}  # sites that refuse scripts: check by hand
    name = "link_report_systems.md" if "--systems" in sys.argv else "link_report.md"
    (ROOT / "docs" / name).write_text("# Link check\n\n" + f"{len(urls)} links, {len(bad)} not OK (403 often means the site blocks scripts, not that the page is gone).\n\n" +
                                      "".join(f"- {s} {u}\n" for u, s in sorted(bad.items())))
    print(len(urls), "links;", len(bad), "not OK")
    for u, s in bad.items():
        print(" ", s, u)
    sys.exit(1 if set(bad) - blocked and "--systems" not in sys.argv else 0)


if __name__ == "__main__":
    main()
