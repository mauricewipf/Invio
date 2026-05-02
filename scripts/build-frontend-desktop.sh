#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUN_BIN="${BUN_BIN:-$HOME/.bun/bin/bun}"

cd "$ROOT_DIR/frontend"

python3 - <<'PY'
from pathlib import Path

root = Path("src/routes")
disabled = []
for pattern in ("+*.server.ts", "+server.ts"):
    for path in root.rglob(pattern):
        target = path.with_suffix(path.suffix + ".desktop-disabled")
        path.rename(target)
        disabled.append(str(target))

Path(".desktop-disabled-routes").write_text("\n".join(disabled))
PY

restore_disabled_routes() {
  python3 - <<'PY'
from pathlib import Path

manifest = Path(".desktop-disabled-routes")
if manifest.exists():
    for line in manifest.read_text().splitlines():
        path = Path(line)
        if path.exists():
            path.rename(Path(str(path).replace(".desktop-disabled", "")))
    manifest.unlink()
PY
}
trap restore_disabled_routes EXIT

DESKTOP_BUILD=true VITE_DESKTOP_BUILD=true "$BUN_BIN" run vite build --config vite.config.desktop.ts
restore_disabled_routes
trap - EXIT

python3 - <<'PY'
from pathlib import Path

index = Path("../src-tauri/dist/index.html")
html = index.read_text()
html = html.replace('href="/_app/', 'href="./_app/')
html = html.replace('import("/_app/', 'import("./_app/')
html = html.replace('href="/favicon.svg"', 'href="./favicon.svg"')
index.write_text(html)
PY
