# `.openboard` file format

An OpenBoard project is a ZIP-compatible archive. Version 1 contains:

```text
manifest.json
document.json
boards/<board-id>.json
assets/<asset-id>.<extension>   # reserved for packaged binary assets
```

`document.json` is the canonical portable representation. Its `manifest.formatVersion` is validated before the document is made available to the renderer. Objects are discriminated unions with stable IDs, layer IDs, transforms, styles, visibility, and lock state. Future versions must be migrated explicitly or rejected with a compatibility error.
