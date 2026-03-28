# Architecture

> This document describes the current codebase structure.
>
> **Last updated**: 2026-03-28

---

## High-level Architecture

Sprite Editor is a client-side React application built with Vite and TypeScript.
It uses HTML5 Canvas for sprite rendering and editing, while React components manage layout, controls, shortcuts, and interaction state.

```text
User Input
  → React Components / Hooks
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
│   ├── App.tsx                 # app shell, shared controller wiring, global shortcuts, right-panel UI state
│   ├── main.tsx                # React entrypoint
│   ├── modes/SpriteMode/
│   │   ├── useSpriteSheet.ts   # core sprite editor state, undo history, and canvas edit logic
│   │   ├── SpriteViewport.tsx  # viewport interactions and canvas surface
│   │   ├── SpriteSidebar.tsx   # left-side tools, import, background removal, canvas resize
│   │   ├── SpriteRightPanel.tsx# right-side frame settings, preview, and export controls
│   │   ├── selectionUtils.ts   # extracted pure selection geometry helpers
│   │   ├── importUtils.ts      # extracted image import helpers
│   │   └── *.test.ts           # helper-focused unit tests
│   └── styles/                 # global styles
├── package.json
└── README.md
```

---

## Layering Rules

1. `src/main.tsx` boots the React app.
2. `src/App.tsx` owns one shared `useSpriteSheet()` instance, passes the controller into the left panel, viewport, and right panel, and holds app-shell UI state such as whether the right panel is collapsed.
3. `useSpriteSheet.ts` owns editor state, canvas drawing, undo history, and destructive edit operations, but not shell-only layout state.
4. `SpriteViewport.tsx` handles pointer-based interactions such as pan, zoom, selection creation, move commit, and background picking.
5. `SpriteSidebar.tsx` is the left operations panel for the top toolbar (pan / rect / lasso / undo), import, background removal, and canvas resize.
6. `SpriteRightPanel.tsx` is the right inspector/export panel for frame settings, preview playback, and export actions.

---

## Cross-cutting Concerns

- **Rendering**: Canvas output uses `image-rendering: pixelated` for sprite clarity.
- **Editing pipeline**: destructive edits are written to `editCanvas`; the displayed/exported source is resolved via `getDrawableSource()`.
- **Floating selection workflow**: moving a selection uses `floatingCanvas` + `floatOffset` during interaction, then commits back into `editCanvas`.
- **Undo model**: undo is scoped to destructive image edits, not transient UI state like pan/zoom/tool toggles.
- **Interaction**: pointer-based viewport interactions handle pan, selection, lasso, movement, zoom, and background sampling.
- **Panel layout**: the left panel handles the integrated editing toolbar (including undo), import, destructive image operations, and canvas resize, while the right panel handles frame controls, preview, and export. The right panel can be collapsed from the app shell to free more space for the viewport.
- **Export model**: selection export, frame export, and full-image export all resolve their source through `getDrawableSource()` so edited canvas state is exported consistently.
- **Build tooling**: Vite handles dev/build, TypeScript provides type checking, ESLint covers baseline static linting, and Vitest covers extracted pure helpers.

---

## Key Conventions

- This is a React/Vite project, not a zero-dependency single-file app.
- Shared editor state should be created once and passed down, not instantiated separately per panel.
- Canvas-related behavior belongs in `useSpriteSheet.ts`; reusable pure geometry/import helpers should live beside the mode and be shared by view components.
- Background removal, canvas resize, selection move commit, and undo are part of the same core editing pipeline.
- Prefer updating existing files over creating new abstractions unless required.
