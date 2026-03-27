# Knowledge Base

> Core feature descriptions, key file paths, and current state model.
> The agent uses this to understand what the product does and where the implementation lives.
>
> **Last updated**: 2026-03-27

---

## Features

### Image Import
- **Description**: Import images through click-to-upload, drag-and-drop, or paste.
- **Key files**: `src/modes/SpriteMode/SpriteSidebar.tsx`, `src/modes/SpriteMode/useSpriteSheet.ts`
- **Status**: Active

### Viewport Navigation & Selection
- **Description**: Supports pan, wheel zoom, rectangle selection, lasso selection, and hover-aware selection movement.
- **Key files**: `src/modes/SpriteMode/SpriteViewport.tsx`, `src/modes/SpriteMode/useSpriteSheet.ts`
- **Status**: Active

### Sprite Frame Configuration & Preview
- **Description**: Lets users configure frame width/height/count/FPS, view grid overlays, preview the current frame, and play animation.
- **Key files**: `src/modes/SpriteMode/SpriteSidebar.tsx`, `src/modes/SpriteMode/useSpriteSheet.ts`
- **Status**: Active

### Destructive Image Editing
- **Description**: Supports background sampling/removal, reset image edits, canvas resize without stretching, and selection move commit.
- **Key files**: `src/modes/SpriteMode/useSpriteSheet.ts`, `src/modes/SpriteMode/SpriteSidebar.tsx`
- **Status**: Active

### Undo
- **Description**: Supports undo for destructive image-edit operations via sidebar button and `Cmd/Ctrl+Z`.
- **Key files**: `src/App.tsx`, `src/modes/SpriteMode/useSpriteSheet.ts`, `src/modes/SpriteMode/SpriteSidebar.tsx`
- **Status**: Active

### Export Tools
- **Description**: Exports the current selection or the current frame as PNG.
- **Key files**: `src/modes/SpriteMode/SpriteSidebar.tsx`
- **Status**: Active

---

## Current State Model

The application is fully client-side. Primary runtime state lives in the `SpriteState` object managed by `useSpriteSheet()`.

Key state groups include:
- **Source state**: `img`, `imgSrc`, `editCanvas`
- **Viewport state**: `panX`, `panY`, `zoom`
- **Tool / selection state**: `tool`, `selType`, `sel`, `lassoDrawing`, `lassoPoints`
- **Animation state**: `currentFrame`, `isPlaying`, `timer`, `lastTime`
- **Move transaction state**: `movingSel`, `moveSelStart`, `floatingCanvas`, `floatOffset`
- **Frame config**: `fw`, `fh`, `fcount`, `fps`, `ox`, `oy`
- **Background removal state**: `bgRemovalTolerance`, `bgSampleColor`, `bgPickMode`
- **Undo support**: bounded undo history exposed via controller methods such as `undo()` / `canUndo`

---

## Key File Paths

| Purpose | Path |
|---------|------|
| React entrypoint | `src/main.tsx` |
| App shell / global shortcuts | `src/App.tsx` |
| Core editor controller | `src/modes/SpriteMode/useSpriteSheet.ts` |
| Viewport interaction layer | `src/modes/SpriteMode/SpriteViewport.tsx` |
| Sidebar controls / import / export | `src/modes/SpriteMode/SpriteSidebar.tsx` |
| Global styles | `src/styles/index.css` |
| Project metadata | `package.json`, `README.md`, `ARCHITECTURE.md` |
| Historical reference file | `sprite-editor.html` |
