# Testing Strategy

> Define how this project ensures correctness and quality through verification.
>
> **Last updated**: 2026-03-28

---

## Philosophy

This project is a React + Vite + TypeScript frontend.

Correctness is currently established through:
- static verification (`npm run typecheck`)
- lint verification (`npm run lint`)
- automated unit tests for extracted pure helpers (`npm run test`)
- production build verification (`npm run build`)
- manual smoke testing of the affected editor flows

---

## Testing Framework & Types

- **Automated unit tests**: Vitest (`npm run test`)
- **Current unit-test focus**: extracted pure helpers such as selection geometry and image import utilities
- **Type checking**: TypeScript (`npm run typecheck`)
- **Linting**: ESLint (`npm run lint`)
- **Build verification**: Vite production build (`npm run build`)
- **Manual verification**: Still required for editor interactions and canvas behavior

---

## Directory Structure

The repository currently keeps lightweight test files next to the extracted helper modules they cover.
Current automated tests live in:
- `src/modes/SpriteMode/selectionUtils.test.ts`
- `src/modes/SpriteMode/importUtils.test.ts`

UI layout changes such as left/right panel composition and right-panel collapse/expand are currently validated manually rather than through component tests.

---

## Running Checks

### Type check

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

### Unit tests

```bash
npm run test
```

### Production build

```bash
npm run build
```

### Full verification

```bash
npm run check
```

---

## Manual Smoke Test Checklist

When editing sprite-editor behavior, manually validate the affected flows as needed:
- image import via click / drag-and-drop / paste
- pan and zoom behavior
- rectangle and lasso selection
- selection movement and commit
- background color pick and background removal
- canvas resize with anchor positioning
- undo for destructive edits from the integrated left-toolbar undo control and via `Cmd/Ctrl+Z`
- current-frame export, selection export, and full-image export
- preview animation playback and frame switching
- right panel collapse/expand behavior, including restoring the panel after collapse
- left toolbar layout, including Pan / Rect / Lasso / Undo alignment and disabled undo behavior
- left/right panel layout after moving frame settings, preview, and export to the right side

---

## Conventions & Rules

When expanding automated coverage, continue to prioritize:
- extracting pure canvas/state helpers from `useSpriteSheet.ts` where practical
- testing deterministic editing logic independently from pointer-event wiring
- keeping UI mocks minimal and focusing on user-visible behavior

---

## Coverage Goals

Automated coverage is now present for a small set of extracted pure helpers, but broad coverage is still not tracked.
The near-term goal is to expand unit coverage around deterministic editing helpers while keeping consistent manual regression coverage for changed interaction flows.
