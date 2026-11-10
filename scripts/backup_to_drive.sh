#!/usr/bin/env bash
# Back up the Microscope Atlas project to an external drive, including what git does not hold:
#   <dest>/project/          the working tree incl. git-ignored local data (data/portfolio_staging, the local-only
#                            scripts/portfolio_*.py), minus rebuildable things (.venv, caches, site/)
#   <dest>/microscope-atlas.bundle   full git history (restore: git clone microscope-atlas.bundle)
#   <dest>/user_cache/       ~/.cache/microscope_atlas, minus public Zenodo downloads (re-downloadable)
#   <dest>/README.txt        what is here and how to restore
# Copies only add or update files; nothing in the backup is deleted. Usage:
#   scripts/backup_to_drive.sh /Volumes/FANTOM/MICROSCOPE_ATLAS_BACKUP
set -euo pipefail
DEST="${1:?destination folder, e.g. /Volumes/FANTOM/MICROSCOPE_ATLAS_BACKUP}"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$DEST/project" "$DEST/user_cache"
rsync -a --exclude '/.venv/' --exclude '__pycache__/' --exclude '.pytest_cache/' --exclude '/site/' \
      --exclude '/data/cache/' --exclude '.DS_Store' "$SRC/" "$DEST/project/"
git -C "$SRC" bundle create "$DEST/microscope-atlas.bundle" --all
git bundle verify "$DEST/microscope-atlas.bundle" > /dev/null
# public datasets (e.g. Zenodo records) are not backed up: they can be downloaded again
[ -d "$HOME/.cache/microscope_atlas" ] && rsync -a --exclude '/zenodo_*/' "$HOME/.cache/microscope_atlas/" "$DEST/user_cache/"
cat > "$DEST/README.txt" <<EOF
Microscope Atlas backup — last run $(date '+%Y-%m-%d %H:%M') from $SRC
Commit: $(git -C "$SRC" rev-parse --short HEAD) ($(git -C "$SRC" log -1 --format=%s))

project/                 working tree, including the git-ignored LOCAL-ONLY material:
                           data/portfolio_staging/ (Parker/Pathak-lab archive renders, movies, manifest.json,
                           display.json) and scripts/portfolio_images*.py, portfolio_manifest*.py that make them.
                           Not public: needs George's and the labs' approval before publishing.
                         Excluded (rebuildable): .venv (pip install -r requirements.txt [-r requirements-ml.txt]),
                           data/cache (cell-identifier embeddings), site/ (scripts/build_static.py).
microscope-atlas.bundle  full git history; restore with:  git clone microscope-atlas.bundle microscopy
user_cache/              ~/.cache/microscope_atlas, except public Zenodo downloads (zenodo_*; download again from Zenodo)

Re-run: scripts/backup_to_drive.sh $DEST
EOF
echo "backup complete: $(du -sh "$DEST" | cut -f1) in $DEST"
