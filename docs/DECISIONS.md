# Decision Log

> Agent should read this file at the start of each new session to quickly understand historical decision context.
> Each record corresponds to a completed exec plan or major repo-level decision, focusing on "why" and "key trade-offs".
>
> **Last updated**: 2026-03-28

---

## Decision Records

### E4 — Normalize shared code into `src/types` and `src/utils` (2026-03-28)
- **What changed**: Shared sprite/domain types were moved into `src/types/`, shared helpers were moved into `src/utils/`, and `src/hooks/` now keeps only actual hook files.
- **Why**: The previous structure left non-hook files under `src/hooks/` and kept `selectionUtils.ts` inside SpriteMode even though it was clearly shared utility code.
- **Key trade-offs**: The directory semantics are cleaner, but import paths are longer and the reorg touched both the controller layer and SpriteMode tests/components.
- **Not done / Remaining**: The repo still has an unused `src/lib/` directory, but it remains intentionally unused because `types` and `utils` are now the clearer shared-code conventions.

### E3 — Move and medium-split the sprite controller hook (2026-03-28)
- **What changed**: The shared sprite controller moved from `src/modes/SpriteMode/useSpriteSheet.ts` to `src/hooks/useSpriteSheet.ts`, and was split into adjacent support modules for shared types, image import helpers, and low-level canvas/source utilities.
- **Why**: The original file had become too large to own cleanly inside the SpriteMode folder, and the controller was easier to evolve once its stable boundaries were separated from view-layer modules.
- **Key trade-offs**: The hook is no longer colocated inside SpriteMode, but the main controller API stays centralized while avoiding a broader feature-folder rewrite.
- **Not done / Remaining**: Selection geometry now lives in `src/utils/selectionUtils.ts` with `Point` / `Selection` moved into `src/types/selectionTypes.ts`, so the main remaining trade-off is import-path churn rather than SpriteMode coupling.

### E2 — Prefer feature-cohesive business files over micro-abstractions (2026-03-28)
- **What changed**: The repo now treats `src/` business feature code as feature-owned and prefers keeping related workflow logic in fewer, larger files instead of splitting it into many small files only by responsibility.
- **Why**: The project is easier to navigate when one feature's behavior is discoverable in one place, and recent tiny helper extractions were starting to conflict with that goal.
- **Key trade-offs**: Cohesive business files may stay well over 300 lines, while thin shell/presentation files and selected shared helpers remain valid exceptions when they improve ownership or testing.
- **Not done / Remaining**: This is a bias, not a blanket threshold for entrypoints, tests, docs, or styles, and helper extraction still needs judgment when reuse or isolated test value is real.

### E1 — React 19 + Vite + TypeScript Frontend Refactor (2026-03-27)
- **What changed**: The project moved from a legacy single-file HTML implementation to a React 19 + Vite + TypeScript frontend with Arco Design, Tailwind CSS, and a shared sprite-editor controller.
- **Why**: The old structure was difficult to extend and maintain as editing workflows became more interactive and stateful.
- **Key trade-offs**: The repo gained a modern component structure, build tooling, and clearer ownership boundaries, but also added dependency and toolchain complexity.
- **Not done / Remaining**: The core controller is still large, automated tests are still limited, and several docs required post-migration cleanup to fully match the new architecture.
- **Details**: `docs/exec-plans/active/E1-react-frontend-refactor.md`
