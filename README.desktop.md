# Invio Desktop App

This folder contains the desktop-specific wrapper for Invio using Tauri.

## Files Overview

| File | Purpose |
|------|---------|
| `frontend/svelte.config.desktop.js` | Desktop SvelteKit config (wrapper) |
| `frontend/vite.config.desktop.ts` | Desktop Vite config (wrapper) |
| `backend/src/desktop-launcher.ts` | Desktop backend launcher (wrapper) |
| `src-tauri/` | Tauri Rust project (desktop shell) |

## Building

```bash
# 1. Compile the backend
cd backend
deno compile --output ../src-tauri/bin/backend src/desktop-launcher.ts

# 2. Build the desktop app
cd ../src-tauri
cargo tauri build

# Output: src-tauri/target/release/bundle/dmg/Invio_*.dmg
```

## Updating After Upstream Changes

When the upstream Invio repo releases a new version:

```bash
# 1. Pull upstream changes (no merge conflicts expected)
git fetch upstream
git merge upstream/main

# 2. Rebuild the desktop launcher (imports may have changed)
cd backend
deno compile --output ../src-tauri/bin/backend src/desktop-launcher.ts

# 3. Rebuild the desktop app
cd ../src-tauri
cargo tauri build

# 4. Done! The new version is packaged.
```

## Why Wrapper Files?

To avoid merge conflicts with upstream updates, all desktop-specific code is in **new files** that don't exist in the upstream repo:

- `svelte.config.desktop.js` (instead of modifying `svelte.config.js`)
- `vite.config.desktop.ts` (instead of modifying `vite.config.ts`)
- `desktop-launcher.ts` (instead of modifying `app.ts` or `database/init.ts`)

This means `git merge upstream/main` will never conflict with our changes.
