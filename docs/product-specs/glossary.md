# Glossary

> Canonical terms used across this project. All agents and contributors should use these terms consistently.
>
> **Last updated**: 2026-03-27

---

## Entries

- **Sprite**: A single image or animation frame that belongs to a larger sprite sheet.
- **Sprite Sheet**: A single image containing multiple frames or graphics arranged for preview, selection, and export.
- **Frame Preview Grid**: The clickable grid of frame thumbnails shown in the sidebar for browsing frames.
- **Current Frame Preview**: The dedicated preview canvas that shows the currently selected animation frame.
- **Offset (X/Y)**: The starting pixel coordinate on the source image from which frame slicing begins.
- **Rect Selection**: A rectangular selection region created with the select tool.
- **Lasso Selection**: A polygonal selection region created from freehand points.
- **Floating Selection**: The temporary off-canvas selection content used while moving a selected region before commit.
- **Background Sample**: The picked RGB color used as the target for transparency removal.
- **Background Removal Tolerance**: The allowed RGB distance used when deciding which pixels become transparent.
- **Resize Anchor**: The 3×3 alignment point that determines how content is padded or cropped during canvas resize.
- **Destructive Edit**: Any operation that changes the working image content, such as background removal, reset, resize, selection move commit, or image replacement.
- **Undo Snapshot**: A stored image-edit state used to revert destructive edits.
