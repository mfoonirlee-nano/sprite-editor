# Architecture

> This document describes the current codebase structure.
>
> **Last updated**: 2026-03-29

---

## High-level Architecture

Sprite Editor is a client-side React application built with Vite and TypeScript.
It uses HTML5 Canvas for sprite rendering and editing, while React components manage layout, controls, shortcuts, and interaction state.

```text
User Input
  → React components / hooks
  → Sprite editor state controller
  → Canvas rendering + destructive edit pipeline
  → Preview / export output
```

---

## Directory Structure & Responsibilities

```text
/
├── index.html
├── src/
│   ├── App.tsx                         # app shell, shared controller wiring, global shortcuts, right-panel UI state
│   ├── main.tsx                        # React entrypoint
│   ├── hooks/
│   │   ├── useSpriteSheet.ts           # public sprite editor controller composed from the modules below
│   │   ├── spriteSheetCore.ts          # initial state, source/canvas helpers, shared low-level controller types
│   │   ├── spriteSheetEdits.ts         # destructive edits, background removal, connected-region pick, move-selection workflow
│   │   ├── spriteSheetEffects.ts       # render loop, marching ants timer, canvas sync, object URL cleanup
│   │   ├── spriteSheetHistory.ts       # undo snapshot creation and history stack management
│   │   └── spriteSheetRendering.ts     # main canvas, preview, grid, and selection rendering helpers
│   ├── constants/
│   │   └── spriteSheetConstants.ts     # shared sprite-editor defaults and behavioral tuning values
│   ├── types/
│   │   ├── selectionTypes.ts           # shared selection/domain types
│   │   └── spriteSheetTypes.ts         # shared sprite controller types and tool union
│   ├── utils/
│   │   ├── selectionUtils.ts           # shared selection geometry helpers
│   │   ├── selectionUtils.test.ts      # colocated tests for selection geometry helpers
│   │   ├── spriteSheetImport.ts        # image import helpers used by the sprite workflow
│   │   ├── spriteSheetImport.test.ts   # colocated tests for image import helpers
│   │   ├── spriteSheetCanvasUtils.ts   # low-level canvas helpers, color helpers, resize math, opaque-region analysis
│   │   └── spriteSheetCanvasUtils.test.ts # colocated tests for canvas helpers
│   ├── modes/SpriteMode/
│   │   ├── SpriteViewport.tsx          # viewport pointer interactions, selection HUD, coordinate axes overlays
│   │   ├── SpriteSidebar.tsx           # left-side tools, import, background removal, canvas resize
│   │   └── SpriteRightPanel.tsx        # right-side frame settings, preview, and export controls
│   └── styles/                         # global styles
├── package.json
└── README.md
```

---

## Layering Rules

1. `src/main.tsx` boots the React app.
2. `src/App.tsx` owns one shared `useSpriteSheet()` instance from `src/hooks/useSpriteSheet.ts`, passes the controller into the left panel, viewport, and right panel, and holds app-shell UI state such as whether the right panel is collapsed.
3. `src/hooks/useSpriteSheet.ts` is the public controller shell; state, rendering, editing, effects, and undo responsibilities are split into adjacent hook-support modules under `src/hooks/`.
4. `SpriteViewport.tsx` handles pointer-driven interaction such as pan, zoom, rect select, lasso, click-based frame pick, move commit, and background sampling, and renders non-canvas overlays such as the top-right selection HUD and edge axes.
5. `SpriteSidebar.tsx` is the left operations panel for the top toolbar (`Pan / Rect / Lasso / Pick / Undo`), import, background removal, and canvas resize.
6. `SpriteRightPanel.tsx` is the right inspector/export panel for frame settings, preview playback, and export actions.

---

## Cross-cutting Concerns

- **Rendering**: Canvas output uses `image-rendering: pixelated` for sprite clarity.
- **Editing pipeline**: destructive edits are written to `editCanvas`; the displayed/exported source is resolved via `getDrawableSource()`.
- **Floating selection workflow**: moving a selection uses `floatingCanvas` + `floatOffset` during interaction, then commits back into `editCanvas`.
- **Undo model**: undo is scoped to destructive image edits, not transient UI state like pan/zoom/tool toggles.
- **Frame pick**: `framePick` is a click tool that finds the tight bounds of the connected non-transparent region under the cursor; transparent clicks are ignored.
- **Viewport overlays**: coordinate axes and selection metrics are rendered as DOM overlays so they stay readable while the canvases are transformed for pan/zoom.
- **Panel layout**: the left panel handles the integrated editing toolbar, import, destructive image operations, and canvas resize, while the right panel handles frame controls, preview, and export. The right panel can be collapsed from the app shell to free more space for the viewport.
- **Export model**: selection export, frame export, and full-image export all resolve their source through `getDrawableSource()` so edited canvas state is exported consistently.
- **Build tooling**: Vite handles dev/build, TypeScript provides type checking, ESLint covers baseline static linting, and Vitest covers extracted pure helpers.

---

## Key Conventions

- This is a React/Vite project, not a zero-dependency single-file app.
- Shared editor state should be created once and passed down, not instantiated separately per panel.
- For `src/` business feature code, prefer feature-cohesive ownership over splitting logic into many small files only by responsibility.
- The shared sprite controller lives in `src/hooks/useSpriteSheet.ts`; adjacent `src/hooks/` modules may hold controller-owned logic when that improves ownership without changing the public controller boundary.
- For business code, files over 300 lines are acceptable when they keep one workflow discoverable in one place, but controller-sized files may still be split into a few shared modules when that improves ownership.
- Background removal, canvas resize, connected-region frame pick, selection move commit, and undo are part of the same core editing pipeline.
- Prefer updating the owning feature file or clearly named shared `types`/`utils` modules over creating unrelated abstractions unless reuse, isolated test value, or a clear readability gain justifies extraction.
