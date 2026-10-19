# OpenBoard development instructions

- Keep `src/core` independent of React and Electron.
- Keep Electron context isolation, sandboxing, and disabled Node integration enabled.
- Treat project files and imported SVG as untrusted input.
- Validate documents before opening and before saving.
- Use stable IDs and versioned schemas for all persisted objects.
- Represent edits as reversible commands where they affect the document.
- Preserve unsaved work through recovery snapshots.
- Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` after substantial changes.
