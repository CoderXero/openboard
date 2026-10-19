# Whiteboard — Linux Desktop Application
## Complete System & Implementation Specification
**Version:** 1.0  
**Application name:** OpenBoard  
**Platform:** Ubuntu Linux and other major Linux distributions  
**Framework:** Electron + TypeScript  
**Application type:** Native desktop whiteboard  
**License:** GPL-3.0-or-later (proposed)  
**Architecture:** Offline-first, modular, extensible  
**Reference:** [OnlineWhiteboard.org](https://onlinewhiteboard.org/)

---

## 1. Executive Summary

### 1.1 Project Overview

OpenBoard will be a free, open-source, Electron-based desktop whiteboard application designed specifically for Linux.

The application will provide a virtually unlimited canvas where users can draw, sketch, create diagrams, organize ideas, annotate images, construct mind maps, and produce presentations.

The design will take inspiration from OnlineWhiteboard.org while providing capabilities that are particularly useful in a Linux desktop environment.

The reference application includes freehand drawing, shapes, sticky notes, connectors, mind maps, tables, multiple boards, image annotation, presentation frames, laser pointers, and export functionality. These capabilities form the baseline for OpenBoard. [OnlineWhiteboard.org](https://onlinewhiteboard.org/?utm_source=chatgpt.com)

**The primary objective is to create a full-featured desktop application that operates entirely offline, requires no account, and saves all user data locally by default.**

### 1.2 Design Principles

1. **Linux-first:** Proper integration with Ubuntu, GNOME, KDE Plasma, X11, and Wayland.
2. **Offline-first:** All essential capabilities work without an internet connection.
3. **Privacy-focused:** No mandatory accounts, cloud storage, telemetry, or third-party services.
4. **Open source:** FLOSS licensing and preference for open-source dependencies.
5. **Responsive:** Smooth drawing and navigation, including on high-resolution displays.
6. **Intuitive:** Users should be able to begin drawing immediately.
7. **Non-destructive:** Drawings and other elements remain editable.
8. **Extensible:** A modular architecture allows future plugins and integrations.
9. **Interoperable:** Support common image, document, and vector formats.
10. **Reliable:** Automatic saving, recovery, and protection against data loss.

### 1.3 Primary Use Cases

| Use case | Description |
|---|---|
| Freehand drawing | Draw using a mouse, stylus, or touchscreen |
| Technical diagrams | Draw flowcharts, architectures, and network diagrams |
| Brainstorming | Create sticky notes and connect ideas |
| Mind mapping | Build hierarchical visual mind maps |
| Teaching | Write on a virtual board and annotate teaching materials |
| Presentations | Create frames and present canvas sections |
| Image annotation | Import screenshots, diagrams, and photographs |
| Document annotation | Import PDFs and annotate their pages |
| Software design | Sketch application interfaces and system architectures |
| Screen sharing | Use the whiteboard during video meetings |
| Personal notes | Save and organize visual notes |
| Collaboration | Optional real-time collaboration in a future release |

### 1.4 Scope

The initial release will include a complete offline whiteboard experience.

Features are divided into three release groups.

| Feature | V1.0 | V1.1 | V2.0 |
|---|:---:|:---:|:---:|
| Infinite canvas | ✓ | | |
| Freehand drawing | ✓ | | |
| Shapes and connectors | ✓ | | |
| Text boxes | ✓ | | |
| Sticky notes | ✓ | | |
| Multiple boards | ✓ | | |
| Layers | ✓ | | |
| Undo/redo | ✓ | | |
| Autosave | ✓ | | |
| PNG/SVG/PDF export | ✓ | | |
| Native project format | ✓ | | |
| Image import | ✓ | | |
| PDF import and annotation | | ✓ | |
| Mind maps | ✓ | | |
| Tables | | ✓ | |
| Presentation mode | ✓ | | |
| Shape recognition | | ✓ | |
| Templates | ✓ | | |
| Screen capture integration | | ✓ | |
| Plugin system | | | ✓ |
| Real-time collaboration | | | ✓ |
| LAN collaboration | | | ✓ |
| AI-assisted diagramming | | | ✓ |
| Optional cloud synchronization | | | ✓ |

The initial release must remain useful without implementing any of the V2 features.

---

# 2. Technology Stack

## 2.1 Recommended Technologies

| Component | Technology | Purpose |
|---|---|---|
| Desktop framework | Electron | Linux desktop integration |
| Programming language | TypeScript | Application development |
| UI framework | React | User interface |
| Build system | Vite | Development and renderer builds |
| Electron tooling | electron-vite | Build orchestration |
| Component library | Radix UI | Accessible UI primitives |
| Styling | Tailwind CSS | UI styling |
| Icon library | Lucide | Consistent SVG icons |
| Canvas engine | Konva.js / react-konva | Canvas objects and interactions |
| Application state | Zustand | UI and editor state |
| Validation | Zod | Runtime schema validation |
| Database | SQLite | Workspace and project metadata |
| Native file storage | Electron main process | Filesystem operations |
| PDF processing | PDF.js | PDF rendering and import |
| PDF generation | pdf-lib | PDF exports |
| SVG | Native SVG generation | Vector exports |
| Image processing | sharp | Image thumbnails and conversion |
| Logging | electron-log | Diagnostics |
| Testing | Vitest | Unit and integration tests |
| UI testing | Playwright | End-to-end testing |
| Packaging | electron-builder | Linux distributions |
| CI/CD | GitHub Actions | Automated testing and releases |

Pin exact dependency versions in the lockfile during implementation rather than hardcoding possibly outdated versions in this specification.

## 2.2 Canvas Engine Decision

The principal architectural choice is the drawing engine.

### Recommendation: Konva.js with an independent document model

Konva provides a practical starting point for interactive whiteboard development.

Advantages include object manipulation, drag-and-drop, transformations, hit detection, grouping, and event handling.

However, the whiteboard document must **not** be stored directly as serialized Konva objects.

Instead, maintain an independent, versioned document model and use Konva only as the rendering and interaction layer.

This allows the application to:

- Replace the rendering engine without changing existing documents.
- Export to SVG independently.
- Implement collaboration later.
- Manage undo/redo predictably.
- Validate imported documents.
- Write renderer-independent automated tests.

### Performance requirement

The architecture must allow future replacement of expensive rendering paths with Canvas2D, OffscreenCanvas, or WebGL-based rendering.

Use separate layers for background, content, interaction feedback, and presentation overlays.

---

# 3. System Architecture

## 3.1 High-Level Architecture

```text
┌───────────────────────────────────────────────────────────┐
│                     OpenBoard Desktop                     │
│                         Electron                          │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Renderer Process                                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ React User Interface                                │  │
│  │                                                     │  │
│  │  Toolbar       Canvas          Properties Panel    │  │
│  │  Workspaces    Layers          Export Dialog        │  │
│  │  Templates     Navigator       Presentation Mode    │  │
│  └─────────────────────────────────────────────────────┘  │
│                           │                               │
│  ┌────────────────────────▼────────────────────────────┐  │
│  │ Whiteboard Engine                                   │  │
│  │                                                     │  │
│  │ Object Model       Rendering Engine                │  │
│  │ Input Controller   Selection Manager               │  │
│  │ History Manager    Layout / Alignment              │  │
│  │ Connector Router   Viewport Controller             │  │
│  └────────────────────────┬────────────────────────────┘  │
│                           │                               │
│  ┌────────────────────────▼────────────────────────────┐  │
│  │ Application Services                                │  │
│  │                                                     │  │
│  │ Document Manager     Autosave                       │  │
│  │ Workspace Manager    Import / Export                │  │
│  │ Asset Manager        Templates                      │  │
│  └────────────────────────┬────────────────────────────┘  │
│                           │                               │
│                     Preload Bridge                        │
│                           │                               │
├───────────────────────────▼───────────────────────────────┤
│                    Electron Main Process                  │
│                                                           │
│  File System           SQLite                            │
│  Native Dialogs        Window Management                 │
│  Printing              Application Settings              │
│  Clipboard             IPC Validation                    │
│  Linux Integration     Security Policies                 │
│                                                           │
├───────────────────────────────────────────────────────────┤
│                      Local Filesystem                     │
│                                                           │
│  Projects / Assets / Backups / Exports / Preferences      │
└───────────────────────────────────────────────────────────┘
```

## 3.2 Electron Processes

### Main Process

Responsible for:

- Window lifecycle.
- Native menus and dialogs.
- File opening and saving.
- SQLite database operations.
- Secure asset access.
- Application preferences.
- Printing.
- OS integration.
- Crash recovery coordination.
- Import/export operations requiring privileged APIs.

### Renderer Process

Responsible for:

- Drawing and canvas rendering.
- User interactions.
- Selection and transformations.
- Editor state.
- Toolbars and dialogs.
- Viewport navigation.
- Presentation rendering.

### Preload Script

Exposes a restricted, typed application API.

For example:

```typescript
interface OpenBoardAPI {
  documents: {
    create(): Promise<DocumentInfo>;

    open(path: string): Promise<DocumentData>;

    save(
      documentId: string,
      data: DocumentData
    ): Promise<void>;

    saveAs(
      data: DocumentData
    ): Promise<string | null>;
  };

  exports: {
    png(options: ExportOptions): Promise<string | null>;

    svg(options: ExportOptions): Promise<string | null>;

    pdf(options: ExportOptions): Promise<string | null>;
  };

  workspaces: {
    list(): Promise<WorkspaceInfo[]>;

    create(name: string): Promise<WorkspaceInfo>;
  };

  system: {
    getVersion(): Promise<string>;

    openExternal(url: string): Promise<void>;
  };
}
```

The implementation should expose specific, validated methods rather than unrestricted IPC access.

**Security requirements:** Enable context isolation, sandbox renderer processes, disable renderer Node.js integration, validate IPC senders and arguments, and enforce a restrictive Content Security Policy. These controls follow Electron's published security recommendations. [Electron](https://www.electronjs.org/docs/latest/tutorial/security/?utm_source=chatgpt.com)

---

# 4. User Interface Specification

## 4.1 Main Application Window

Proposed layout:

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ OpenBoard    File  Edit  View  Insert  Tools  Window  Help                │
├───────────────────────────────────────────────────────────────────────────┤
│ Project: System Architecture                  Saved ✓     Export   Present│
├──────┬───────────────────────────────────────────────┬────────────────────┤
│      │                                               │                    │
│  ↖   │                                               │   PROPERTIES       │
│      │                                               │                    │
│  ✎   │                                               │   Object: Rectangle│
│      │                                               │                    │
│  ▭   │                                               │   Fill             │
│      │                                               │   [ Color Picker ] │
│  ○   │                                               │                    │
│      │                                               │   Stroke           │
│  →   │                                               │   [ Color Picker ] │
│      │                                               │                    │
│  T   │                INFINITE CANVAS                │   Width: 3px       │
│      │                                               │                    │
│  ▤   │                                               │   Opacity: 100%    │
│      │                                               │                    │
│  ◇   │                                               │   Rotation: 0°     │
│      │                                               │                    │
│  🖼   │                                               │   Position         │
│      │                                               │   X: 240           │
│  ✋  │                                               │   Y: 180           │
│      │                                               │                    │
│      │                                               │   [ Align ]        │
│      │                                               │                    │
├──────┴───────────────────────────────────────────────┴────────────────────┤
│ Board 1 ▼     + New Board      Objects: 18    Zoom: 100%     Undo   Redo  │
└───────────────────────────────────────────────────────────────────────────┘
```

This diagram is a structural wireframe, not the final visual design.

## 4.2 UI Regions

### Top Menu Bar

Contains:

- File
- Edit
- View
- Insert
- Arrange
- Tools
- Window
- Help

Menus must integrate with Linux desktop conventions.

### Main Toolbar

Displays the most frequently used commands:

- New project.
- Open project.
- Save.
- Undo/redo.
- Drawing tools.
- Zoom.
- Export.
- Presentation mode.

### Left Drawing Toolbar

Vertically arranged drawing tools.

Users may collapse or reposition it.

### Right Properties Panel

Context-sensitive editing controls for the selected object.

The panel can be hidden to maximize canvas space.

### Bottom Status Bar

Displays:

- Active board.
- Number of objects.
- Number of selected objects.
- Canvas coordinates.
- Zoom level.
- Autosave status.
- Current drawing tool.

### Optional Sidebar

Provides access to:

- Workspaces.
- Boards.
- Layers.
- Templates.
- Assets.
- Presentation frames.

## 4.3 Appearance

Support:

- Light mode.
- Dark mode.
- Follow system appearance.
- High-contrast mode.
- Adjustable interface scaling.

The canvas background must be configurable independently from the application theme.

---

# 5. Drawing and Editing Capabilities

## 5.1 Infinite Canvas

The canvas must support unrestricted logical coordinates rather than a fixed page size.

Core capabilities:

- Pan horizontally and vertically.
- Zoom toward cursor position.
- Zoom to selection.
- Zoom to content.
- Fit all content into the window.
- Reset zoom to 100%.
- Support negative coordinates.
- Display optional grid and rulers.

### Zoom

Default range:

```text
Minimum: 5%
Maximum: 3200%
Default: 100%
```

Provide configurable limits.

### Navigation

| Input | Action |
|---|---|
| Mouse wheel | Vertical scrolling or configured zoom |
| Ctrl + Wheel | Zoom |
| Middle mouse drag | Pan |
| Space + Drag | Pan |
| Touchpad gestures | Pan and zoom where supported |
| Pinch gesture | Zoom |
| Home | Fit all content |
| Ctrl + 0 | Reset zoom |
| Ctrl + + | Zoom in |
| Ctrl + - | Zoom out |

Zooming must maintain the logical canvas point under the cursor.

## 5.2 Freehand Drawing

### Pen

Capabilities:

- Adjustable color.
- Adjustable stroke width.
- Adjustable opacity.
- Smooth strokes.
- Round or square line caps.
- Pressure sensitivity.
- Optional stroke stabilization.

Default width presets:

```text
1 px
2 px
4 px
8 px
12 px
20 px
```

Users may also enter custom values.

### Highlighter

A translucent drawing tool.

Requirements:

- Default opacity of approximately 35%.
- Configurable thickness.
- Preset colors.
- Non-destructive editing.
- Consistent appearance across export formats.

### Calligraphy Pen

An angled, variable-width drawing instrument.

### Eraser

Support two modes:

**Object eraser:** Removes entire objects or strokes.

**Stroke eraser:** Removes only the affected section of a freehand stroke, splitting the remaining stroke into editable segments when necessary.

### Stylus Input

Use Pointer Events for mouse, touch, and stylus support.

Capture available pressure, tilt, and pointer-type information.

Unsupported stylus properties must degrade gracefully.

Palm rejection should be supported where the input hardware and operating system expose sufficient information.

---

## 5.3 Shape Tools

Initial shapes:

| Shape | Required |
|---|---|
| Rectangle | Yes |
| Rounded rectangle | Yes |
| Circle | Yes |
| Ellipse | Yes |
| Triangle | Yes |
| Diamond | Yes |
| Pentagon | Yes |
| Hexagon | Yes |
| Star | Yes |
| Arrow | Yes |
| Line | Yes |
| Cloud | Yes |
| Speech bubble | Yes |
| Cylinder | Yes |
| Document | Yes |
| Process | Yes |
| Decision | Yes |
| Database | Yes |
| Custom SVG shape | Future |

All shapes support:

- Resize.
- Move.
- Rotate.
- Fill.
- Stroke.
- Transparency.
- Duplication.
- Grouping.
- Layer ordering.
- Locking.
- Alignment.

Shapes remain individually editable after saving and reopening.

## 5.4 Lines and Connectors

Support:

- Straight lines.
- Curved lines.
- Elbow connectors.
- Orthogonal connectors.
- Single-headed arrows.
- Double-headed arrows.
- Dashed lines.
- Dotted lines.

### Smart Connectors

Connectors may attach to a shape's anchor points.

When a connected shape moves, the connector must update automatically.

For V1, support deterministic straight and orthogonal routing with manual waypoints.

Obstacle-avoiding routing may be introduced in V1.1.

Connector endpoints must reference object identifiers rather than only storing absolute coordinates.

---

## 5.5 Text Tool

Users can insert editable text anywhere on the canvas.

Formatting options:

- Font family.
- Font size.
- Font color.
- Bold.
- Italic.
- Underline.
- Alignment.
- Line spacing.
- Text wrapping.
- Background color.
- Text-box border.

Support multiline text and Unicode.

### Text Editing

Double-clicking a text object enters editing mode.

Text must support:

- Selection.
- Copy/paste.
- Keyboard navigation.
- Undo/redo.
- Automatic text-box resizing.
- Manual resizing.

Text rendering and SVG/PDF export should use bundled or reliably available fonts, with appropriate licensing and font-substitution behavior.

---

## 5.6 Sticky Notes

Sticky notes provide fast visual annotations.

Default colors:

- Yellow.
- Blue.
- Green.
- Pink.
- Purple.
- Orange.

Capabilities:

- Double-click to edit.
- Resize.
- Move.
- Change color.
- Change text style.
- Duplicate.
- Rotate.
- Group.
- Attach connectors.

Sticky notes must support multiline text and automatic wrapping.

---

## 5.7 Object Selection and Manipulation

### Selection Methods

- Single click.
- Shift + click.
- Drag selection rectangle.
- Select all.
- Select by type.
- Select objects within a frame.

### Manipulation

- Move.
- Resize.
- Rotate.
- Duplicate.
- Delete.
- Copy/paste.
- Cut.
- Group/ungroup.
- Lock/unlock.
- Bring forward.
- Send backward.
- Bring to front.
- Send to back.

### Alignment

Support:

- Align left.
- Align right.
- Align top.
- Align bottom.
- Align center horizontally.
- Align center vertically.
- Distribute horizontally.
- Distribute vertically.

### Snapping

Objects should optionally snap to:

- Grid.
- Other object edges.
- Other object centers.
- Connector anchors.
- Frame boundaries.

Display temporary alignment guides.

---

# 6. Mind Mapping

## 6.1 Overview

OpenBoard must include a dedicated mind-mapping tool.

A mind map consists of connected nodes arranged hierarchically.

## 6.2 Node Types

- Root node.
- Parent node.
- Child node.
- Sibling node.

Each node supports:

- Text.
- Color.
- Shape.
- Border.
- Icon.
- Connectors.
- Collapse/expand.

## 6.3 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| M | Activate mind-map tool |
| Tab | Add child node |
| Enter | Add sibling node |
| Delete | Delete selected node |
| F2 | Rename node |
| Space | Pan canvas when not editing |

## 6.4 Layout

Supported layouts:

- Left-to-right tree.
- Right-to-left tree.
- Horizontal hierarchy.
- Vertical hierarchy.
- Radial mind map.

V1 must implement at least left-to-right and radial layouts.

Automatic layout must preserve node relationships and avoid overlapping nodes under normal conditions.

Users can override node positioning manually.

---

# 7. Boards, Workspaces, and Projects

## 7.1 Data Organization

Use this hierarchy:

```text
Workspace
    │
    ├── Project
    │     │
    │     ├── Board 1
    │     ├── Board 2
    │     └── Board 3
    │
    └── Project
          │
          ├── Board 1
          └── Board 2
```

### Workspace

A logical collection of related projects.

Examples:

```text
Personal
Work
Software Architecture
Teaching
Brainstorming
```

### Project

A saved whiteboard document containing one or more boards.

### Board

An independent canvas with its own objects, viewport, background, and settings.

## 7.2 Project Management

Users must be able to:

- Create workspaces.
- Rename workspaces.
- Delete workspaces.
- Create projects.
- Rename projects.
- Duplicate projects.
- Move projects between workspaces.
- Search projects.
- Sort projects.
- View recent projects.
- Pin favorite projects.

Deleting a workspace must require confirmation and clearly state whether projects will also be deleted or moved elsewhere.

## 7.3 Board Management

Within each project:

- Add boards.
- Rename boards.
- Duplicate boards.
- Reorder boards.
- Delete boards.
- Change board backgrounds.
- Export individual boards.
- Export all boards.

The application must preserve board order.

---

# 8. Layers

Each board supports an ordered stack of layers.

Default layers:

```text
Annotations
Drawings
Images
Background
```

Users may add, rename, reorder, hide, lock, and delete layers.

Objects are assigned to one layer.

Layer deletion must offer the choice to move its objects to another layer or delete those objects.

Rendering must respect layer ordering.

Hidden layers must not appear in exports unless explicitly included.

Locked layers must not allow editing.

---

# 9. Canvas Backgrounds

Support:

1. Plain white.
2. Plain black.
3. Custom solid color.
4. Dot grid.
5. Square grid.
6. Graph paper.
7. Ruled paper.
8. Isometric grid.
9. Transparent.
10. Custom background image.

Users can customize grid spacing, line color, opacity, and visibility.

The exported image should include the selected background by default.

Transparent export must remain available for PNG and SVG.

---

# 10. Images and Document Annotation

## 10.1 Image Import

Supported formats:

- PNG.
- JPEG.
- WebP.
- GIF (static first frame in V1).
- BMP.
- SVG, after sanitization.

Images may be imported through:

- File dialog.
- Drag and drop.
- Clipboard paste.

### Image Capabilities

- Resize.
- Rotate.
- Crop.
- Move.
- Lock.
- Adjust opacity.
- Send backward.
- Annotate.
- Maintain aspect ratio.

Imported images must be stored in the project's asset package rather than relying on their original filesystem path.

## 10.2 SVG Import

SVG input must be sanitized.

Disable:

- Embedded scripts.
- External resource fetching.
- Event-handler attributes.
- Unsafe foreign objects.

For V1, SVG may be imported as a single image object.

Individual editing of imported SVG paths can be considered later.

## 10.3 PDF Import — V1.1

Users can import PDF pages as non-destructive canvas elements.

Use PDF.js to rasterize pages for display.

The original PDF must be retained as a project asset.

Support:

- Import one page.
- Import selected pages.
- Import all pages.
- Insert each page into an independent frame.
- Annotate imported pages.

For V1.1, the underlying PDF text does not need to remain editable.

---

# 11. Presentation Mode

## 11.1 Frames

A frame identifies a rectangular section of the canvas.

Frames can be:

- Created.
- Named.
- Resized.
- Reordered.
- Duplicated.
- Deleted.

Available frame presets:

```text
16:9 Widescreen
4:3 Standard
A4 Portrait
A4 Landscape
Letter Portrait
Letter Landscape
Custom
```

## 11.2 Presenting

Presentation mode must:

- Hide editing controls.
- Display frames sequentially.
- Support next/previous navigation.
- Allow fullscreen presentation.
- Display a laser pointer.
- Allow Escape to exit.

Frame order is independent from the visual position of the frames on the canvas.

## 11.3 Laser Pointer

The laser pointer provides a temporary visual indicator.

Pointer effects must not become part of the saved document.

Configurable options:

- Color.
- Size.
- Trail duration.
- Visibility.

---

# 12. File Storage and Native Project Format

## 12.1 Project File Extension

Use:

```text
.openboard
```

The `.openboard` format should be a ZIP-compatible container containing JSON and associated assets.

This avoids embedding potentially enormous images directly in JSON.

Example:

```text
architecture.openboard
│
├── manifest.json
│
├── document.json
│
├── boards/
│   ├── board-001.json
│   └── board-002.json
│
├── assets/
│   ├── image-001.png
│   └── image-002.svg
│
└── thumbnails/
    └── preview.png
```

## 12.2 Manifest

```json
{
  "format": "openboard",
  "formatVersion": 1,
  "applicationVersion": "1.0.0",
  "projectId": "a2e1d1fe-5db7-4b65-9300-2d2e5b4b0cf1",
  "title": "System Architecture",
  "createdAt": "2026-10-19T12:00:00Z",
  "updatedAt": "2026-10-19T12:30:00Z",
  "boards": [
    "board-001",
    "board-002"
  ]
}
```

## 12.3 Example Board

```json
{
  "id": "board-001",
  "name": "Architecture",
  "background": {
    "type": "grid",
    "color": "#ffffff",
    "gridColor": "#e5e7eb",
    "gridSize": 20
  },
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1
  },
  "layers": [
    {
      "id": "layer-001",
      "name": "Drawings",
      "visible": true,
      "locked": false,
      "order": 0
    }
  ],
  "objects": [
    {
      "id": "object-001",
      "type": "rectangle",
      "layerId": "layer-001",
      "x": 150,
      "y": 100,
      "width": 200,
      "height": 100,
      "rotation": 0,
      "style": {
        "fill": "#ffffff",
        "stroke": "#111827",
        "strokeWidth": 2,
        "opacity": 1
      },
      "locked": false,
      "visible": true
    }
  ]
}
```

## 12.4 Additional Document Requirements

Every object must have:

- Stable UUID.
- Object type.
- Board identifier or implicit board ownership.
- Layer identifier.
- Transform.
- Style.
- Visibility state.
- Lock state.
- Ordering information.

Object-specific properties must use discriminated TypeScript unions.

Additional objects will require explicit schemas for:

- Paths and pen strokes.
- Text.
- Connectors.
- Images.
- Sticky notes.
- Groups.
- Frames.
- Mind-map nodes.

### Schema Versioning

Project files must contain a version number.

Migration functions must support opening documents created by earlier application versions.

Unknown future file versions must produce a clear compatibility error rather than silently corrupting the document.

---

# 13. Data Persistence

## 13.1 SQLite

SQLite should store application metadata, not serve as the canonical representation of portable whiteboard documents.

Suggested tables:

```text
workspaces
projects
project_locations
recent_files
settings
autosave_snapshots
asset_index
```

### Example Schema

```sql
CREATE TABLE workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES workspaces(id),
    name TEXT NOT NULL,
    file_path TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_opened_at TEXT
);

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE recent_files (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL UNIQUE,
    last_opened_at TEXT NOT NULL
);
```

Enable SQLite foreign keys and use transactional migrations.

Do not use SQLite to store every mouse movement or every pen stroke.

## 13.2 Linux Storage Locations

Follow the XDG Base Directory specification.

Recommended defaults:

```text
~/.config/openboard/
    settings.json

~/.local/share/openboard/
    openboard.db
    projects/
    templates/
    assets/

~/.cache/openboard/
    thumbnails/
    autosave-staging/
    logs/
```

Crash-recovery snapshots should be stored in durable application data, not solely in a disposable cache directory.

Allow users to change the default project location.

Do not create mandatory folders in the user's home directory outside the appropriate XDG locations.

## 13.3 Autosave

Autosave must be enabled by default.

Recommended behavior:

- Debounce changes for two seconds.
- Create a recovery checkpoint every 30 seconds while dirty.
- Save when switching boards.
- Save when closing a project.
- Save when the application loses focus, where practical.
- Save during normal application shutdown.

### Reliability

Project saves must use:

1. Serialization.
2. Validation.
3. Temporary file creation.
4. File synchronization where supported.
5. Atomic replacement on the same filesystem.
6. Backup retention.

Autosave and explicit save must never write concurrently to the same target without coordination.

Failed saves must display an error and preserve the unsaved document in memory.

The application must never indicate that a document is saved until persistence has succeeded.

## 13.4 Crash Recovery

On startup, detect unfinished sessions and offer:

```text
Recover Unsaved Work

A recovery copy was found for:
System Architecture

Last recovery:
October 19, 2026 — 12:30 PM

[Recover] [Preview] [Discard]
```

Do not delete the recovery snapshot until successful recovery or explicit discard.

---

# 14. Undo/Redo and History

## 14.1 Command-Based Architecture

Every document modification must be represented as a reversible command.

Examples:

```typescript
interface Command {
  id: string;
  execute(): void;
  undo(): void;
}

class AddObjectCommand implements Command {
  id: string;

  constructor(
    private object: WhiteboardObject,
    private document: WhiteboardDocument
  ) {}

  execute(): void {
    this.document.addObject(this.object);
  }

  undo(): void {
    this.document.removeObject(this.object.id);
  }
}
```

Implement commands for:

- Adding objects.
- Removing objects.
- Moving objects.
- Resizing.
- Rotating.
- Editing text.
- Changing styles.
- Grouping.
- Layer operations.
- Connector operations.
- Board operations.

## 14.2 History Behavior

Requirements:

- Minimum 100 reversible editing operations.
- Configurable history capacity.
- Undo/redo across tool changes.
- Undo/redo across board changes within the active project.
- Consecutive drag movements consolidated into one operation.
- A completed pen stroke represented by one operation.
- A single paste action represented by one operation.

History should be stored in memory during normal editing.

Persistent history is optional for V1.1.

---

# 15. Import and Export

## 15.1 Supported Formats

| Format | Import | Export | Editable after reopening |
|---|---|---|---|
| `.openboard` | Yes | Yes | Yes |
| PNG | Yes | Yes | As image object |
| JPEG | Yes | Yes | As image object |
| SVG | Yes | Yes | Imported as image in V1 |
| PDF | V1.1 | Yes | Annotation objects only |
| WebP | Yes | Yes | As image object |
| JSON | Limited | Yes | Yes, for supported schema |

## 15.2 PNG Export

Allow users to configure:

- Current board or all boards.
- Entire content or selected region.
- Resolution multiplier.
- Background color.
- Transparent background.
- Include/exclude grid.
- Padding.

Supported resolution multipliers:

```text
1x
2x
3x
4x
Custom
```

Extremely large exports must be tiled to avoid renderer memory exhaustion.

## 15.3 SVG Export

SVG export must preserve vector content where possible.

Shapes, lines, text, connectors, and freehand strokes should remain vector elements.

Raster images may be embedded or referenced according to export settings.

The default SVG export should be self-contained.

## 15.4 PDF Export

Support:

- Export current board.
- Export all boards.
- Export selected presentation frames.
- A4, Letter, and custom page sizes.
- Portrait and landscape.
- Fit to page.
- Multiple pages.

Preserve vector shapes and text where feasible. Complex visual effects may require rasterization.

## 15.5 Native Project Export

The native format must preserve the complete editable document.

Requirements:

- No destructive flattening.
- All imported assets included.
- Stable object identifiers.
- Relative asset references.
- Schema validation.
- Version compatibility.

A project saved on one Linux machine must be portable to another machine without requiring the original imported assets.

---

# 16. Clipboard and Drag-and-Drop

## 16.1 Clipboard

Support:

- Copy objects.
- Cut objects.
- Paste objects.
- Paste text.
- Paste screenshots.
- Paste images.

For copying between two OpenBoard windows, prefer an application-specific clipboard MIME format with a standard image or text fallback.

Object identifiers must be regenerated when pasting objects as duplicates.

## 16.2 Drag-and-Drop

Users must be able to drag supported files onto the canvas.

Expected behavior:

| File | Action |
|---|---|
| PNG/JPEG/WebP | Insert image |
| SVG | Sanitize and insert |
| `.openboard` | Open project |
| PDF | Import workflow, V1.1 |
| Plain text | Create text object |
| Unsupported file | Display informative error |

Dropped files should never be executed.

---

# 17. Keyboard Shortcuts

The following defaults should be implemented.

| Shortcut | Action |
|---|---|
| Ctrl + N | New project |
| Ctrl + O | Open project |
| Ctrl + S | Save |
| Ctrl + Shift + S | Save As |
| Ctrl + Z | Undo |
| Ctrl + Shift + Z | Redo |
| Ctrl + Y | Redo |
| Ctrl + C | Copy |
| Ctrl + V | Paste |
| Ctrl + X | Cut |
| Ctrl + A | Select all |
| Ctrl + D | Duplicate |
| Ctrl + G | Group |
| Ctrl + Shift + G | Ungroup |
| Delete | Delete selection |
| V | Selection tool |
| P | Pen |
| E | Eraser |
| H | Hand tool |
| R | Rectangle |
| O | Ellipse |
| L | Line |
| A | Arrow |
| T | Text |
| N | Sticky note |
| M | Mind map |
| F | Frame |
| I | Import image |
| F11 | Fullscreen |
| Esc | Cancel current action |
| Space + Drag | Pan |
| Ctrl + 0 | Reset zoom |
| Ctrl + Plus | Zoom in |
| Ctrl + Minus | Zoom out |

Tool shortcuts must not activate while the user is editing text.

Allow users to customize keyboard shortcuts through application settings.

Detect and report conflicting assignments.

---

# 18. Templates

## 18.1 Built-in Templates

Include these templates in the initial release:

| Template | Purpose |
|---|---|
| Blank Whiteboard | General drawing |
| Brainstorming | Ideas and sticky notes |
| Mind Map | Hierarchical idea organization |
| Flowchart | Processes and decisions |
| Kanban | Work tracking |
| SWOT Analysis | Business planning |
| Network Diagram | IT infrastructure planning |
| Software Architecture | System design |
| UML Class Diagram | Software design |
| Sequence Diagram | Application interactions |
| Meeting Notes | Collaborative discussions |
| Lesson Board | Teaching |
| Storyboard | Visual storytelling |
| Timeline | Chronological planning |

## 18.2 Template Creation

Users must be able to save any board as a reusable template.

Templates are stored locally.

A template must preserve:

- Background.
- Layout.
- Objects.
- Frames.
- Styles.
- Layers.

Creating a new board from a template must generate new document identifiers while preserving the template.

---

# 19. Application Preferences

Implement a settings interface organized into the following categories.

| Category | Settings |
|---|---|
| General | Language, startup behavior, recent files |
| Appearance | Light/dark mode, accent color, UI scale |
| Canvas | Default background, grid, zoom |
| Drawing | Default pen, smoothing, pressure sensitivity |
| Input | Mouse, touchscreen, stylus preferences |
| Files | Default save directory, autosave |
| Export | Default format, resolution, background |
| Keyboard | Shortcut customization |
| Performance | Render quality, caching |
| Privacy | Network permissions, optional telemetry |
| Advanced | Logging, diagnostics, experimental features |

No telemetry should be enabled by default.

---

# 20. Linux Desktop Integration

## 20.1 Supported Platforms

Primary target:

**Ubuntu 24.04 LTS and newer supported Ubuntu releases.**

Secondary targets:

- Linux Mint.
- Debian.
- Fedora.
- Pop!_OS.
- Other distributions compatible with the selected packaging format.

Target architectures:

- x86_64: Required.
- ARM64: Recommended.

## 20.2 Display Servers

Support both:

- X11.
- Wayland.

The application must be tested under GNOME and KDE Plasma.

Expected capabilities:

- HiDPI scaling.
- Multiple monitors.
- Window resizing.
- Fullscreen.
- Clipboard.
- File dialogs.
- Drag-and-drop.
- Stylus input.
- Touchscreen input where hardware permits.

Use Electron and Chromium's supported Linux display-server configuration rather than forcing obsolete command-line switches.

## 20.3 Packaging

Produce:

```text
openboard_1.0.0_amd64.deb
openboard-1.0.0.x86_64.rpm
OpenBoard-1.0.0-x86_64.AppImage
```

ARM64 packages should be produced when the build pipeline supports the target architecture.

Flatpak support is recommended after V1.

## 20.4 Desktop Entry

Example:

```ini
[Desktop Entry]
Name=OpenBoard
Comment=Offline-first digital whiteboard
Exec=openboard %F
Icon=openboard
Terminal=false
Type=Application
Categories=Graphics;Education;Office;
MimeType=application/x-openboard;
StartupNotify=true
```

Register `.openboard` files with the desktop MIME system.

Support opening projects using:

```bash
openboard architecture.openboard
```

## 20.5 Linux CLI Options

Provide a small command-line interface.

```bash
openboard --help
openboard --version
openboard project.openboard
openboard --new
openboard --safe-mode
openboard --disable-gpu
```

Optional export commands:

```bash
openboard \
  --headless \
  --export png \
  --output diagram.png \
  architecture.openboard
```

Headless export is a V1.1 capability, since it requires additional renderer lifecycle and font handling.

---

# 21. Security Requirements

## 21.1 Electron Security

Use the following renderer configuration:

```typescript
const window = new BrowserWindow({
  width: 1440,
  height: 900,
  minWidth: 900,
  minHeight: 600,

  webPreferences: {
    preload: preloadPath,
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    webSecurity: true
  }
});
```

Additional requirements:

- Load local application resources through a secure custom application protocol.
- Validate all IPC arguments.
- Restrict navigation to approved application routes.
- Deny unexpected popup windows.
- Do not expose generic filesystem APIs to the renderer.
- Use restrictive Content Security Policy rules.
- Sanitize SVG, HTML, and Markdown input.
- Reject unsupported document schemas.
- Restrict external URL schemes.
- Require explicit user interaction before opening external links.
- Validate all imported file paths.
- Prevent ZIP extraction path traversal.
- Enforce archive size, entry count, and decompression ratio limits.

Electron's security checklist explicitly recommends sandboxing, context isolation, restrictive CSP rules, and careful IPC validation. [Electron](https://www.electronjs.org/docs/latest/tutorial/security/?utm_source=chatgpt.com)

## 21.2 Project File Security

Treat `.openboard` files as untrusted input.

Import must validate:

1. File signature.
2. ZIP structure.
3. Manifest.
4. Schema version.
5. Object types.
6. Asset paths.
7. Asset sizes.
8. Total decompressed size.
9. Image dimensions.
10. Supported MIME types.

Unknown object types should not cause the application to crash.

Set configurable import limits with reasonable initial values, such as a 500 MB compressed project limit and a 2 GB decompressed limit.

Very large projects should generate a warning and require explicit confirmation.

## 21.3 Privacy

The application must:

- Require no account.
- Operate without internet access.
- Store files locally by default.
- Avoid external fonts and CDN dependencies.
- Avoid automatic upload of documents.
- Disable tracking and analytics by default.
- Permit disabling update checks.

Future collaboration must be strictly opt-in.

---

# 22. Performance Requirements

## 22.1 Target Hardware

Minimum supported configuration:

| Component | Requirement |
|---|---|
| CPU | Modern dual-core x86_64 |
| RAM | 4 GB |
| Storage | 500 MB free for application |
| Graphics | Chromium-compatible graphics |
| Resolution | 1280 × 720 |

Recommended:

| Component | Requirement |
|---|---|
| CPU | Quad-core or better |
| RAM | 8 GB or more |
| Storage | SSD |
| Graphics | Hardware acceleration |
| Resolution | 1920 × 1080 or higher |

These are initial engineering targets, not yet validated hardware requirements.

## 22.2 Performance Targets

| Operation | Target |
|---|---|
| Warm startup | Under 3 seconds |
| Drawing response | Within 16 ms for normal workloads |
| Canvas refresh | 60 FPS target |
| Add shape | Under 50 ms |
| Undo/redo | Under 100 ms |
| Switch normal-sized boards | Under 250 ms |
| Open 1,000-object project | Under 2 seconds |
| Open 10,000-object project | Under 10 seconds |
| Export ordinary board to PNG | Under 3 seconds |
| Idle CPU usage | Below 2% of one core |

Targets apply to recommended hardware and representative test documents.

Large images, complex paths, and high-resolution exports may exceed these values.

## 22.3 Optimization Strategy

Implement:

- Viewport culling.
- Spatial indexing.
- Layer caching.
- Dirty-region invalidation where feasible.
- Throttled pointer updates.
- Batched state updates.
- Worker-based serialization.
- Thumbnail caching.
- Lazy loading of inactive boards.
- Reusable image buffers.

Avoid storing high-frequency pointer movement in global React state.

Use mutable drawing-session state during an active stroke and commit the final stroke to the document model.

## 22.4 Spatial Index

Introduce an R-tree or equivalent index for object bounds.

The index supports:

- Viewport queries.
- Selection.
- Nearby-object detection.
- Snapping.
- Connector routing.

For very large boards, object queries should avoid scanning every document object on each pointer movement.

---

# 23. Error Handling

The application must recover gracefully from expected failures.

| Failure | Required behavior |
|---|---|
| Invalid project file | Display validation error |
| Unsupported project version | Display compatibility warning |
| Corrupt ZIP | Reject file without crashing |
| Missing asset | Show placeholder and warning |
| Save permission denied | Show error and retain document |
| Disk full | Preserve unsaved changes |
| Image decoding fails | Reject image and continue |
| PDF import fails | Explain reason and retain project |
| GPU initialization fails | Offer software rendering |
| Unexpected renderer crash | Offer recovery on restart |
| SQLite corruption | Attempt controlled recovery |
| Export failure | Report failure without modifying project |

All recoverable failures must be logged.

## 23.1 Logging

Use structured logs.

Example:

```json
{
  "timestamp": "2026-10-19T12:30:00Z",
  "level": "error",
  "component": "document-manager",
  "operation": "save",
  "projectId": "a2e1d1fe-5db7-4b65-9300-2d2e5b4b0cf1",
  "errorCode": "DISK_FULL",
  "message": "Unable to save project"
}
```

Avoid logging whiteboard content, imported text, or sensitive filesystem paths unless explicitly enabled for diagnostics.

---

# 24. Future Collaboration Architecture

Real-time collaboration is intentionally excluded from V1.

However, the document architecture must not prevent its introduction.

## 24.1 Collaboration Modes

Future modes:

**LAN collaboration:** One user hosts a session accessible to others on the local network.

**Remote collaboration:** Users collaborate through a self-hosted relay or synchronization server.

**Offline editing:** Users edit independently and synchronize later.

## 24.2 Recommended Technology

Use a CRDT-based synchronization engine such as Yjs.

Potential architecture:

```text
┌──────────────────┐
│ OpenBoard Client │
│      User A      │
└────────┬─────────┘
         │
         │ WebSocket
         │
┌────────▼─────────┐
│ Collaboration    │
│ Server           │
│                  │
│ Yjs Updates      │
│ Session Presence │
│ Access Control   │
└────────┬─────────┘
         │
         │ WebSocket
         │
┌────────▼─────────┐
│ OpenBoard Client │
│      User B      │
└──────────────────┘
```

## 24.3 Collaboration Features

Future capabilities:

- Shared sessions.
- Presence indicators.
- Multiple cursors.
- Object-level synchronization.
- Shared drawing.
- Conflict resolution.
- View-only access.
- Editor access.
- Session passwords.
- Session expiration.

The initial document schema should use stable identifiers and deterministic operations to simplify later CRDT integration.

---

# 25. Optional AI Capabilities — Future Release

AI integration must remain optional and must not be required to use OpenBoard.

Given the Linux-first, open-source architecture, local Ollama integration would be a suitable future extension.

## 25.1 Local LLM Integration

Example settings:

```text
AI Provider: Ollama

Endpoint:
http://localhost:11434

Model:
qwen3.5

API Timeout:
120 seconds
```

Also support remote Ollama hosts.

## 25.2 Proposed AI Features

### Text-to-Diagram

User enters:

> Create a network architecture showing a firewall, router, two switches, three Linux servers, and a PostgreSQL database.

The LLM generates a structured diagram description.

OpenBoard validates the response and converts it into editable canvas objects.

### Text-to-Mind-Map

User enters:

> Create a mind map showing the major components of an OAuth2 authorization server.

The application generates hierarchical nodes and connectors.

### Diagram Explanation

Users select an existing diagram and ask the AI to describe it.

### Diagram Improvement

The application suggests:

- Alignment improvements.
- Missing connections.
- Better grouping.
- More consistent labels.

## 25.3 AI Security Model

Never permit LLM responses to execute arbitrary JavaScript.

All generated diagrams must pass a strict document schema validator.

AI-generated output should be presented for review before being added to the document.

No whiteboard data should be transmitted to remote AI endpoints without explicit user authorization.

---

# 26. Source Code Organization

Recommended repository structure:

```text
openboard/
│
├── README.md
├── LICENSE
├── CLAUDE.md
├── CONTRIBUTING.md
├── CHANGELOG.md
│
├── package.json
├── package-lock.json
├── tsconfig.json
├── electron.vite.config.ts
├── electron-builder.yml
│
├── src/
│   │
│   ├── main/
│   │   ├── index.ts
│   │   ├── windows/
│   │   ├── ipc/
│   │   ├── filesystem/
│   │   ├── database/
│   │   ├── document-manager/
│   │   ├── export/
│   │   └── security/
│   │
│   ├── preload/
│   │   ├── index.ts
│   │   └── api.ts
│   │
│   ├── renderer/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── toolbar/
│   │   │   ├── sidebar/
│   │   │   ├── properties/
│   │   │   ├── dialogs/
│   │   │   └── layout/
│   │   │
│   │   ├── canvas/
│   │   │   ├── CanvasView.tsx
│   │   │   ├── CanvasRenderer.ts
│   │   │   ├── ViewportController.ts
│   │   │   └── SpatialIndex.ts
│   │   │
│   │   ├── tools/
│   │   │   ├── SelectTool.ts
│   │   │   ├── PenTool.ts
│   │   │   ├── EraserTool.ts
│   │   │   ├── ShapeTool.ts
│   │   │   ├── ConnectorTool.ts
│   │   │   ├── TextTool.ts
│   │   │   ├── StickyNoteTool.ts
│   │   │   ├── MindMapTool.ts
│   │   │   └── FrameTool.ts
│   │   │
│   │   ├── state/
│   │   ├── hooks/
│   │   ├── styles/
│   │   └── utils/
│   │
│   ├── core/
│   │   ├── document/
│   │   ├── objects/
│   │   ├── commands/
│   │   ├── geometry/
│   │   ├── connectors/
│   │   ├── serialization/
│   │   ├── validation/
│   │   └── migrations/
│   │
│   └── shared/
│       ├── types/
│       ├── constants/
│       └── schemas/
│
├── assets/
│   ├── icons/
│   ├── fonts/
│   └── templates/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── fixtures/
│   └── performance/
│
├── scripts/
│   ├── build-linux.sh
│   ├── package-deb.sh
│   ├── package-appimage.sh
│   └── generate-icons.sh
│
├── docs/
│   ├── architecture.md
│   ├── file-format.md
│   ├── development.md
│   ├── testing.md
│   └── releases.md
│
└── .github/
    └── workflows/
        ├── ci.yml
        └── release.yml
```

Keep core document logic independent of React and Electron.

This separation is a mandatory architectural requirement.

---

# 27. Development Environment

## 27.1 Prerequisites

Ubuntu development environment:

```bash
sudo apt update

sudo apt install -y \
    git \
    curl \
    build-essential \
    python3 \
    pkg-config \
    libsqlite3-dev \
    libsecret-1-dev \
    libnss3-dev \
    libgtk-3-dev
```

Install a supported Node.js LTS release and npm using the organization's preferred version manager.

Use a Node version compatible with the selected Electron toolchain.

## 27.2 Project Initialization

Suggested setup:

```bash
npm create electron-vite@latest openboard
cd openboard

npm install
```

Choose the React and TypeScript template.

Install the principal application dependencies:

```bash
npm install \
    react-konva \
    konva \
    zustand \
    zod \
    lucide-react \
    @radix-ui/react-dialog \
    @radix-ui/react-dropdown-menu \
    @radix-ui/react-tooltip \
    pdf-lib \
    pdfjs-dist
```

The exact versions and compatibility of these dependencies must be verified during implementation.

## 27.3 Development Commands

Provide:

```bash
npm run dev
npm run build
npm run test
npm run test:e2e
npm run lint
npm run typecheck
npm run dist:linux
```

All scripts must be documented in the README.

---

# 28. Testing Strategy

## 28.1 Unit Tests

Use Vitest.

Required coverage:

- Geometry.
- Coordinate transforms.
- Viewport calculations.
- Object serialization.
- Object validation.
- Undo/redo.
- Layer operations.
- Document migrations.
- Connector attachment.
- Mind-map layout.
- Selection calculations.
- Asset referencing.

Target at least 85% branch coverage for core document logic.

## 28.2 Integration Tests

Test:

- Save and reopen.
- Import and export.
- Asset packaging.
- SQLite metadata.
- Project migrations.
- IPC validation.
- Crash recovery.
- Workspace management.

## 28.3 End-to-End Tests

Use Playwright with Electron support.

Critical scenarios:

1. Launch application.
2. Create a project.
3. Draw a pen stroke.
4. Create a rectangle.
5. Add text.
6. Add a sticky note.
7. Connect two shapes.
8. Undo and redo.
9. Save project.
10. Close application.
11. Reopen project.
12. Verify document integrity.
13. Export PNG.
14. Export SVG.
15. Export PDF.

## 28.4 Security Tests

Include tests for:

- Malformed project archives.
- ZIP path traversal.
- Oversized archive entries.
- Invalid SVG.
- Script injection.
- Unsafe external URLs.
- Renderer IPC abuse.
- Unsupported document versions.
- Corrupted asset references.

## 28.5 Performance Tests

Create deterministic test documents with:

- 100 objects.
- 1,000 objects.
- 10,000 objects.
- 50,000 objects.
- Large images.
- Thousands of pen points.
- Hundreds of connected shapes.

Measure:

- Open time.
- Rendering frame rate.
- Input latency.
- Memory consumption.
- Export time.
- Save time.

Performance regressions should be reported in CI.

---

# 29. CI/CD Pipeline

## 29.1 GitHub Actions

Use GitHub Actions for continuous integration.

Recommended workflow:

```text
Pull Request
    │
    ▼
Install Dependencies
    │
    ▼
TypeScript Validation
    │
    ▼
ESLint
    │
    ▼
Unit Tests
    │
    ▼
Integration Tests
    │
    ▼
Electron Build
    │
    ▼
Linux Packaging
    │
    ▼
Artifacts
```

For tagged releases:

```text
Git Tag
    │
    ▼
Build
    │
    ▼
Test
    │
    ▼
Package .deb
    │
    ▼
Package AppImage
    │
    ▼
Package .rpm
    │
    ▼
Generate Checksums
    │
    ▼
Publish GitHub Release
```

## 29.2 Release Artifacts

Example:

```text
OpenBoard-1.0.0-x86_64.AppImage
openboard_1.0.0_amd64.deb
openboard-1.0.0.x86_64.rpm
SHA256SUMS
```

Publish release notes and provide SHA-256 checksums.

For production distribution, implement package signing where the distribution channel supports it.

---

# 30. Implementation Phases

The coding agent should implement the application incrementally.

Each phase must produce working, testable software.

| Phase | Deliverables | Completion criteria |
|---|---|---|
| 1. Foundation | Electron, React, TypeScript, Linux packaging | App launches on Ubuntu |
| 2. Canvas | Rendering, pan, zoom, grid | Stable infinite canvas |
| 3. Drawing | Pen, eraser, shapes, text | Basic editing works |
| 4. Editing | Selection, transforms, clipboard, history | Objects remain editable |
| 5. Storage | Project format, SQLite, autosave | Save/reopen without data loss |
| 6. Advanced tools | Connectors, sticky notes, mind maps | Structured diagrams work |
| 7. Organization | Workspaces, boards, layers, templates | Multiple projects supported |
| 8. Export | PNG, SVG, PDF | Correct output generated |
| 9. Presentation | Frames, fullscreen, laser pointer | Presentations work |
| 10. Hardening | Security, testing, performance | Release criteria satisfied |
| 11. Release | Packaging, docs, CI/CD | Linux installers published |

## 30.1 Phase 1 — Foundation

Create the project and establish the architecture.

Deliverables:

- Electron main process.
- React renderer.
- Typed preload API.
- Application menus.
- Theme support.
- Linux desktop packaging.
- Development tooling.

Do not proceed until the application launches reliably on Ubuntu.

## 30.2 Phase 2 — Canvas Engine

Implement:

- Infinite logical coordinates.
- Pan and zoom.
- Coordinate transforms.
- Grid backgrounds.
- Rendering layers.
- Pointer input handling.

The canvas must support negative coordinates and zooming toward the cursor.

## 30.3 Phase 3 — Basic Drawing

Implement:

- Pen.
- Eraser.
- Rectangle.
- Ellipse.
- Line.
- Arrow.
- Text.

Each tool must have unit tests for its core geometry and document operations.

## 30.4 Phase 4 — Object Editing

Implement:

- Selection.
- Moving.
- Resizing.
- Rotation.
- Grouping.
- Alignment.
- Clipboard.
- Undo/redo.

## 30.5 Phase 5 — Persistence

Implement:

- Native file format.
- Workspace database.
- Project loading.
- Project saving.
- Autosave.
- Crash recovery.

At this point the application should already be useful as a basic desktop whiteboard.

## 30.6 Phase 6 — Advanced Features

Implement:

- Smart connectors.
- Sticky notes.
- Mind maps.
- Layers.
- Frames.
- Object links.

## 30.7 Phase 7 — Export

Implement:

- PNG.
- SVG.
- PDF.
- Export settings.
- Multi-board export.

## 30.8 Phase 8 — Production Readiness

Complete:

- Error handling.
- Diagnostics.
- Security testing.
- Performance optimization.
- Linux packaging.
- Documentation.
- Release automation.

---

# 31. Acceptance Criteria

Version 1.0 is complete only when all of the following are satisfied.

### Functional Acceptance

- Users can create, save, reopen, and modify projects.
- Canvas drawing works with mouse and supported stylus devices.
- Shapes and freehand strokes remain editable.
- Connectors remain attached when shapes move.
- Undo/redo behaves correctly.
- Multiple boards are supported.
- Project assets remain available after moving the project file.
- PNG, SVG, and PDF exports succeed.
- Autosave and crash recovery work.
- Presentation mode works.

### Linux Acceptance

- Ubuntu installation succeeds.
- Application operates on X11.
- Application operates on Wayland.
- File dialogs work.
- Clipboard integration works.
- HiDPI scaling works.
- Application launches without an internet connection.
- AppImage and Debian packages install and run successfully.

### Quality Acceptance

- No known critical crashes.
- No known project-corruption defects.
- Core tests pass.
- The TypeScript build passes.
- Security tests pass.
- Performance targets are measured and documented.
- README contains installation and usage instructions.

---

# 32. Coding Agent Instructions

The following instructions should be placed in the repository's `CLAUDE.md` file, or the equivalent configuration used by another development agent.

```markdown
# OpenBoard Development Instructions

## Mission

Develop OpenBoard, a production-ready, open-source,
Linux-first Electron whiteboard application.

Follow the OpenBoard system specification.

## Technology

- Electron
- TypeScript
- React
- Vite
- Konva.js
- Zustand
- SQLite
- Zod

## Architecture Rules

1. Separate Electron main, preload, and renderer code.
2. Keep the document model independent of the rendering engine.
3. Use TypeScript strict mode.
4. Do not use any.
5. Validate untrusted input using Zod.
6. Use typed IPC APIs.
7. Do not expose Node.js directly to the renderer.
8. Do not disable Electron sandboxing.
9. Do not use remote CDN dependencies.
10. Maintain backwards compatibility of saved documents.

## Implementation Rules

1. Implement features incrementally.
2. Write tests for core functionality.
3. Keep the application runnable after each milestone.
4. Do not replace working implementations with placeholders.
5. Do not silently skip requirements.
6. Log errors with useful diagnostic information.
7. Keep dependencies current and security-supported.
8. Prefer FLOSS dependencies.
9. Document architectural decisions.
10. Avoid unnecessary abstractions.

## Document Rules

- All canvas objects must have stable UUIDs.
- All edits must go through the document command system.
- Do not store Konva instances in project files.
- Use a versioned, validated document format.
- Preserve imported assets.
- Use atomic project saves.
- Implement crash recovery.
- Never discard unsaved user changes silently.

## Linux Requirements

- Ubuntu is the primary target.
- Support X11 and Wayland.
- Follow XDG directory conventions.
- Build .deb and AppImage packages.
- Do not assume Windows or macOS paths.
- Support HiDPI displays.

## Security Requirements

- Keep contextIsolation enabled.
- Keep nodeIntegration disabled.
- Keep sandbox enabled.
- Apply Content Security Policy.
- Validate IPC arguments.
- Sanitize SVG imports.
- Reject malformed project archives.
- Never execute imported document content.

## Testing Requirements

Run the following after each substantial change:

npm run typecheck
npm run lint
npm run test
npm run build

Fix any failures before continuing.

## Development Workflow

For each milestone:

1. Review requirements.
2. Identify affected modules.
3. Implement functionality.
4. Write or update tests.
5. Run validation.
6. Document changes.
7. Update milestone status.
8. Continue to the next milestone.

Do not declare a milestone complete unless its
acceptance tests pass.

## Definition of Done

OpenBoard must be a functional Linux desktop application
that supports drawing, diagrams, mind maps, multiple boards,
native project storage, and document export.

The application must be secure, offline-first, and reliable.
```

---

# 33. Key Architectural Decisions

| Decision | Choice | Reason |
|---|---|---|
| Desktop runtime | Electron | Cross-distribution Linux support |
| Application language | TypeScript | Type safety |
| UI | React | Component-based interface |
| Canvas engine | Konva | Object-based drawing |
| Document model | Custom | Format independence |
| Metadata database | SQLite | Local persistence |
| Project format | ZIP + JSON | Portable and editable |
| Undo/redo | Command pattern | Predictable reversibility |
| Autosave | Recovery snapshots + atomic saves | Reliability |
| Rendering optimization | Culling and spatial indexing | Scalability |
| Native communication | Typed IPC bridge | Security |
| Primary packaging | AppImage and DEB | Broad Linux compatibility |
| Collaboration | Yjs, future | Conflict-free synchronization |
| AI | Optional Ollama, future | Local-first integration |
| License | GPL-3.0-or-later | FLOSS distribution |

---

# 34. Final Delivery Requirements

The development effort must produce:

**Application:** A functional Linux desktop whiteboard, not merely a demonstration or a static interface.

**Source code:** A complete Git repository with documented architecture, build scripts, tests, and installation instructions.

**Installers:** At least a Debian package and an AppImage for x86_64 Linux.

**Documentation:** Installation guide, user guide, keyboard shortcuts, native file format specification, developer guide, and troubleshooting guide.

**Quality evidence:** Automated test results, performance benchmarks, security checks, and successful save/reopen/export tests.

**Release:** A reproducible tagged release containing compiled packages, checksums, source code, and release notes.

## Recommended Implementation Priority

The highest-priority engineering work is the **canvas engine, independent document model, reversible command system, and reliable native project persistence**. Those four components determine whether OpenBoard can evolve into a stable, full-featured desktop application.

Once those foundations are implemented correctly, tools such as sticky notes, mind maps, connectors, frames, and future AI-generated diagrams can be added without redesigning the entire application.

The result should be a genuinely native-feeling Linux whiteboard: fast, offline, private, fully editable, and capable of replacing browser-based whiteboards for everyday drawing, brainstorming, teaching, and technical diagramming.
