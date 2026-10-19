# Development guide

The main process owns native filesystem operations and export dialogs. The preload process exposes only the typed methods declared in `src/shared/types.ts`. The renderer owns interaction state and renders the versioned document model using SVG; it does not persist renderer-specific instances.

For a new feature, add or update the shared type and Zod schema first, add a command or serializer test, then connect the renderer interaction and main-process capability if native access is required.
