"""Cached JSON loading. Files are re-read when their modification time changes."""
import json
from pathlib import Path

_cache: dict[Path, tuple[float, object]] = {}


def load(path: Path, default=None):
    """Return parsed JSON from path, or default if the file is missing."""
    path = Path(path)
    if not path.exists():
        return default
    mtime = path.stat().st_mtime
    hit = _cache.get(path)
    if hit and hit[0] == mtime:
        return hit[1]
    value = json.loads(path.read_text(encoding="utf-8"))
    _cache[path] = (mtime, value)
    return value


def load_lists(folder: Path) -> list:
    """Concatenate every JSON list in folder (sorted by name), tagging each item with its file."""
    out = []
    for f in sorted(Path(folder).glob("*.json")):
        for item in load(f, []):
            out.append({**item, "_file": f.stem})
    return out
