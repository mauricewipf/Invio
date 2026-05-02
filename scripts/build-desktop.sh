#!/bin/bash
set -e

echo "Building Invio Desktop App..."

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DENO_BIN="${DENO_BIN:-$HOME/.deno/bin/deno}"

# Compile backend
echo "Compiling backend..."
cd "$ROOT_DIR/backend"
"$DENO_BIN" compile --allow-read --allow-write --allow-net --allow-env --allow-run \
  --output ../src-tauri/bin/backend \
  src/desktop-launcher.ts
cp ../src-tauri/bin/backend ../src-tauri/bin/backend-aarch64-apple-darwin
mkdir -p ../src-tauri/target/release
cp ../src-tauri/bin/backend ../src-tauri/target/release/backend

# Build desktop app
echo "Building desktop app..."
cd ../src-tauri
cargo tauri build

echo "Done! DMG located at:"
echo "  src-tauri/target/release/bundle/dmg/Invio_*.dmg"
