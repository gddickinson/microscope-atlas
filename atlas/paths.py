"""Data locations used across the package."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
SYSTEMS = DATA / "systems"
COMPONENTS = DATA / "components"
CONTENT = DATA / "content"
STATIC = Path(__file__).resolve().parent / "web" / "static"
