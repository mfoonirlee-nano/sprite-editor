# Architecture

> This document describes the current codebase structure.
>
> **Last updated**: 2026-03-27

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
│   ├── App.tsx                 # app shell, shared controller wiring, global shortcuts
│   ├── main.tsx                # React entrypoint
│   ├── modes/SpriteMode/
│   │   ├── useSpriteSheet.ts   # core sprite editor state, undo history, and canvas edit logic
│   │   ├── SpriteViewport.tsx  # viewport interactions and canvas surface
│   │   └── SpriteSidebar.tsx   # controls, import/export, preview, background removal, resize
│   └── styles/                 # global styles
├── package.json
└── README.md
```

---

## Layering Rules

1. `src/main.tsx` boots the React app.
2. `src/App.tsx` owns one shared `useSpriteSheet()` instance and passes the controller into mode components.
3. `useSpriteSheet.ts` owns editor state, canvas drawing, undo history, and destructive edit operations.
4. `SpriteViewport.tsx` handles pointer-based interactions such as pan, zoom, selection creation, move commit, and background picking.
5. `SpriteSidebar.tsx` exposes user actions and configuration, but should reuse controller methods instead of duplicating canvas logic.

---

## Cross-cutting Concerns

- **Rendering**: Canvas output uses `image-rendering: pixelated` for sprite clarity.
- **Editing pipeline**: destructive edits are written to `editCanvas`; the displayed/exported source is resolved via `getDrawableSource()`.
- **Floating selection workflow**: moving a selection uses `floatingCanvas` + `floatOffset` during interaction, then commits back into `editCanvas`.
- **Undo model**: undo is scoped to destructive image edits, not transient UI state like pan/zoom/tool toggles.
- **Interaction**: pointer-based viewport interactions handle pan, selection, lasso, movement, zoom, and background sampling.
- **Build tooling**: Vite handles dev/build, TypeScript provides type checking.

---

## Key Conventions

- This is a React/Vite project, not a zero-dependency single-file app.
- Shared editor state should be created once and passed down, not instantiated separately per panel.
- Canvas-related behavior belongs in `useSpriteSheet.ts`; view components should stay thin.
- Background removal, canvas resize, selection move commit, and undo are part of the same core editing pipeline.
- Prefer updating existing files over creating new abstractions unless required.
