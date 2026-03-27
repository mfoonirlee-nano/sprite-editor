# Testing Strategy

> Define how this project ensures correctness and quality through verification.
>
> **Last updated**: 2026-03-27

---

## Philosophy

This project is a React + Vite + TypeScript frontend, but it does not currently have a dedicated automated test suite.

Today, correctness is primarily established through:
- static verification (`npm exec tsc --noEmit`)
- production build verification (`npm run build`)
- manual smoke testing of the affected editor flows

---

## Testing Framework & Types

- **Automated unit/integration tests**: Not currently configured
- **Type checking**: TypeScript (`npm exec tsc --noEmit`)
- **Build verification**: Vite production build (`npm run build`)
- **Manual verification**: Required for editor interactions and canvas behavior

---

## Directory Structure

There is currently no dedicated `test/` or `__tests__/` structure in the repository.

---

## Running Checks

### Type check

```bash
npm exec tsc --noEmit
```

### Production build

```bash
npm run build
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
- undo for destructive edits
- current-frame export and selection export
- preview animation playback and frame switching

---

## Conventions & Rules

If automated tests are introduced later, prioritize:
- extracting pure canvas/state helpers from `useSpriteSheet.ts` where practical
- testing deterministic editing logic independently from pointer-event wiring
- keeping UI mocks minimal and focusing on user-visible behavior

---

## Coverage Goals

No automated coverage is currently tracked.
The near-term goal is reliable build checks plus consistent manual regression coverage for changed features.
