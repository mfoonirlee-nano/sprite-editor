# Architecture

> This document describes the current codebase structure.
>
> **Last updated**: 2026-03-27

---

## High-level Architecture

Sprite Editor is a client-side React application built with Vite and TypeScript.
It uses HTML5 Canvas for sprite rendering and editing, while React components manage layout, controls, and interaction state.

```text
User Input
  → React Components / Hooks
  → Sprite editor state controller
  → Canvas rendering + export
```

---

## Directory Structure & Responsibilities

```text
/
├── index.html
├── src/
│   ├── App.tsx                 # app shell and shared controller wiring
│   ├── main.tsx                # React entrypoint
│   ├── modes/SpriteMode/
│   │   ├── useSpriteSheet.ts   # core sprite editor state and canvas logic
│   │   ├── SpriteViewport.tsx  # viewport interactions and canvas surface
│   │   └── SpriteSidebar.tsx   # controls, preview, export, edit actions
│   └── styles/                 # global styles
├── package.json
└── README.md
```

---

## Layering Rules

1. `src/main.tsx` boots the React app.
2. `src/App.tsx` owns shared `useSpriteSheet()` state and passes the controller into mode components.
3. `useSpriteSheet.ts` owns editor state, canvas drawing, and destructive edit operations.
4. UI components should reuse controller methods instead of duplicating canvas logic.

---

## Cross-cutting Concerns

- **Rendering**: Canvas output uses `image-rendering: pixelated` for sprite clarity.
- **Editing pipeline**: destructive edits are written to `editCanvas`; the displayed/exported source is resolved via `getDrawableSource()`.
- **Interaction**: pointer-based viewport interactions handle pan, selection, lasso, movement, zoom, and sampling.
- **Build tooling**: Vite handles dev/build, TypeScript provides type checking.

---

## Key Conventions

- This is a React/Vite project, not a zero-dependency single-file app.
- Shared editor state should be created once and passed down, not instantiated separately per panel.
- Canvas-related behavior belongs in `useSpriteSheet.ts`; view components should stay thin.
- Prefer updating existing files over creating new abstractions unless required.
