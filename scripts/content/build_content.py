"""Write the hand-authored content JSON files from their Python sources.

Run: .venv/bin/python scripts/content/build_content.py
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
OUT = HERE.parent.parent / "data" / "content"

from fundamentals_src import SECTIONS  # noqa: E402
from glossary_src import TERMS  # noqa: E402
from portfolio_src import PORTFOLIO  # noqa: E402
from community_src import COMMUNITY  # noqa: E402


def write(name, value):
    (OUT / f"{name}.json").write_text(json.dumps(value, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(name, len(value))


write("fundamentals", SECTIONS)
write("glossary", [{"term": t, "def": d, **({"see": s} if s else {})} for t, d, s in TERMS])
try:
    from portfolio_projects_src import PROJECTS  # noqa: E402
    PORTFOLIO = {**PORTFOLIO, "projects": PROJECTS}
except ImportError:
    pass
from calcium_src import CALCIUM  # noqa: E402
PORTFOLIO = {**PORTFOLIO, "calcium": CALCIUM}
write("portfolio", PORTFOLIO)
write("community", [{"group": g, "links": [{"name": n, "url": u, "about": a} for n, u, a in rows]} for g, rows in COMMUNITY])

try:
    from videos_src import VIDEOS  # noqa: E402
    write("videos", VIDEOS)
except ImportError:
    pass
