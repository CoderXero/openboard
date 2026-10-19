# OpenBoard

OpenBoard is an offline-first whiteboard for Linux, built with Electron, React, and TypeScript. It keeps the editable document model independent from the SVG renderer and stores projects locally in portable `.openboard` ZIP containers.

## Current capabilities

- Infinite canvas with pan, zoom, grid, negative coordinates, and pointer input.
- Pen, highlighter, eraser, rectangles, ellipses, lines, arrows, text, sticky notes, mind-map nodes, and presentation frames.
- Selection, move, duplicate, delete, object inspector, layers, visibility/locking, multiple boards, undo/redo, and keyboard shortcuts.
- Local image import through the file picker or drag-and-drop.
- Atomic `.openboard` save/reopen, schema validation, recovery snapshots, and local-only IPC.
- SVG, PNG, and PDF export.
- AppImage and Debian packaging configuration.

## Installation

### Debian/Ubuntu

Install or upgrade the Debian package with:

```bash
sudo apt install --reinstall ./dist/OpenBoard-0.1.0-amd64.deb
```

The same process is available as:

```bash
bash scripts/install-linux.sh
```

The `--reinstall` flag is important when upgrading an earlier OpenBoard package because it refreshes the Electron runtime and sandbox helper.

Verify that the sandbox helper has the required ownership and permissions:

```bash
stat -c '%A %a %U:%G %n' /opt/OpenBoard/chrome-sandbox
```

The expected result includes `4755 root:root`:

```text
-rwsr-xr-x 4755 root:root /opt/OpenBoard/chrome-sandbox
```

If your environment defines Electron's Node compatibility variables, launch OpenBoard with them removed:

```bash
env -u ELECTRON_RUN_AS_NODE -u ELECTRON_NO_ATTACH_CONSOLE openboard --disable-gpu
```

If this is required in every terminal session, remove those variables from your shell startup files and open a new session.

### AppImage

```bash
chmod +x OpenBoard-0.1.0-x86_64.AppImage
env -u ELECTRON_RUN_AS_NODE -u ELECTRON_NO_ATTACH_CONSOLE ./OpenBoard-0.1.0-x86_64.AppImage --disable-gpu
```

### Troubleshooting

If the application still exits immediately, check the sandbox helper first. Reinstall the Debian package if it is not owned by `root:root` or does not show mode `4755`.

## Development

Requires Node.js 20+ and npm.

```bash
npm install
npm run dev
```

The quality gates are:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

To create Linux artifacts:

```bash
npm run dist:linux
```

The generated artifacts are placed in `dist/`. The application never requires an account or network service to create, edit, save, or export a project.

## Architecture

- `src/core`: renderer-independent document types, validation, serialization, commands, and deterministic mind-map layout.
- `src/main`: Electron window, secure IPC, atomic filesystem writes, recovery, and export services.
- `src/preload`: the restricted typed bridge exposed to the renderer.
- `src/renderer`: React UI and SVG canvas interaction layer.
- `tests`: document round trips, schema rejection, command history, and mind-map layout tests.

The native format contains `manifest.json`, `document.json`, and one JSON board entry per board. Assets are intended to live under `assets/` in the same ZIP container; imported images currently use data URLs so projects remain portable while the asset manager is extended.

## Security notes

The renderer uses context isolation, sandboxing, disabled Node integration, a restrictive CSP, validated IPC arguments, HTTPS-only external links, and project schema validation. Imported project files are treated as untrusted ZIP archives and are bounded before parsing.

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
