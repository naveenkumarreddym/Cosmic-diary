#!/bin/bash
# Build Cosmic_Diary.html from the source files in this directory.
# Run from anywhere:
#    bash path/to/src/build.sh
# Output lands in the repository root (one level up from src/).
set -e

SRC_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SRC_DIR/.." && pwd )"
OUT_HTML="$REPO_ROOT/Cosmic_Diary.html"
TMP_BUNDLE=$(mktemp)

cd "$SRC_DIR"

# Concatenate JS modules in dependency order.
# 14_ui.js must come last (references everything else).
# 15_prompt.js and 16_diary.js come before 14_ui.js.
echo "/* Built $(date -u +%Y-%m-%dT%H:%M:%SZ) */" > "$TMP_BUNDLE"
for f in 02_time.js 04a_vsop_inner.js 04b_vsop_outer.js 05_moon.js 06_nodes.js \
         07_ayanamsa.js 08_houses.js 09_chart.js 10_dasha.js 11_transits.js \
         12_render.js 12b_vargas.js 12c_planet_icons.js 13_cities.js \
         15_prompt.js 16_diary.js 14_ui.js; do
  echo "" >> "$TMP_BUNDLE"
  echo "/* ============ $f ============ */" >> "$TMP_BUNDLE"
  cat "$f" >> "$TMP_BUNDLE"
done

# Substitute CSS+JS into shell.html, compute SHA-256 of the JS payload between
# integrity markers, and bake that hash into the expected-hash placeholder.
SRC_DIR="$SRC_DIR" OUT_HTML="$OUT_HTML" TMP_BUNDLE="$TMP_BUNDLE" python3 <<'PY'
import hashlib, os, sys
from pathlib import Path

src_dir = Path(os.environ["SRC_DIR"])
out_path = Path(os.environ["OUT_HTML"])
tmp_bundle = Path(os.environ["TMP_BUNDLE"])

shell = (src_dir / "shell.html").read_text()
css   = (src_dir / "styles.css").read_text()
js    = tmp_bundle.read_text()

out = shell.replace("/*__CSS__*/", css).replace("/*__JS__*/", js)

START = "/*__INTEGRITY_START__*/"
END   = "/*__INTEGRITY_END__*/"
i1 = out.find(START)
i2 = out.find(END)
if i1 == -1 or i2 == -1 or i2 <= i1:
    sys.exit("Build error: integrity markers missing or misordered in output.")
payload = out[i1 + len(START):i2]
bundle_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()

if "__EXPECTED_HASH__" not in out:
    sys.exit("Build error: __EXPECTED_HASH__ placeholder not found.")
out = out.replace("__EXPECTED_HASH__", bundle_hash)

out_path.write_text(out)
full_file_hash = hashlib.sha256(out.encode("utf-8")).hexdigest()

print(f"Built: {out_path}")
print(f"  Size              : {len(out):,} bytes")
print(f"  Bundle SHA-256    : {bundle_hash}")
print(f"  Full-file SHA-256 : {full_file_hash}")
PY

rm -f "$TMP_BUNDLE"
echo "Done."
