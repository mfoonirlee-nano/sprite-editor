# Knowledge Base

> Core feature descriptions, key file paths, and data model.
> The agent uses this to understand what the product does and where things live.
>
> **Last updated**: YYYY-MM-DD

---

## Features

### Image Import & Parsing
- **Description**: Imports images via drag-and-drop or file selection and renders them onto the main canvas.
- **Key files**: `sprite-editor.html` (FileReader logic)
- **Status**: Active

### Sprite Parameter Configuration
- **Description**: Allows users to configure sprite dimensions (width, height, offsets, FPS).
- **Key files**: `sprite-editor.html` (Input handlers)
- **Status**: Active

### Animation Preview
- **Description**: Real-time animation preview using a dedicated canvas.
- **Key files**: `sprite-editor.html` (Animation loop with `requestAnimationFrame`)
- **Status**: Active

### Export Tools
- **Description**: Exports the current selection, a single frame, or all sliced frames.
- **Key files**: `sprite-editor.html` (Canvas `toBlob` and anchor tag download logic)
- **Status**: Active

---

## Data Model

The application does not use a backend database. The primary state is kept in memory using JavaScript variables:
- `img`: The loaded Image object.
- `spriteWidth`, `spriteHeight`, `offsetX`, `offsetY`, `fps`: Sprite configuration parameters.
- `frames`: Array of generated canvas elements for each slice.

---

## Key File Paths

| Purpose | Path |
|---------|------|
| Entire Application | `sprite-editor.html` |
| Project Info | `package.json`, `README.md` |
