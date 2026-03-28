# Tech Debt Tracking

> Centralized record of known tech debt. Review and repay periodically.
> Priority: 🔴 High (blocks development) | 🟡 Medium (affects quality) | 🟢 Low (nice to improve)
>
> **Last updated**: 2026-03-27

---

## Active Tech Debt

| # | Priority | Domain | Description | Impact | Link | Created |
| - | -------- | ------ | ----------- | ------ | ---- | ------- |
| 1 | 🟡 Medium | Editor architecture | `src/hooks/useSpriteSheet.ts` is smaller and clearer after the split, but the main controller still mixes rendering, interaction state, animation, undo, and destructive editing orchestration. | Makes future feature work and regression isolation harder when controller responsibilities keep growing. | `src/hooks/useSpriteSheet.ts` | 2026-03-27 |
| 2 | 🟡 Medium | Verification | The repo still relies on type-check/build verification plus manual smoke tests; there is no dedicated automated test suite for core editing flows. | Regressions in canvas editing behavior are easier to miss. | `docs/TESTING.md` | 2026-03-27 |
| 3 | 🟢 Low | Documentation process | The repo previously accumulated stale architecture/docs after the React migration; doc-sync discipline is now defined, but future tasks must keep following it. | Documentation can drift again if process is ignored. | `AGENTS.md` | 2026-03-27 |

---

## Resolved Tech Debt

| # | Domain | Description | Resolved | Resolution | Link |
| - | ------ | ----------- | -------- | ---------- | ---- |
| 1 | Documentation alignment | Multiple docs still described the app as a single-file vanilla HTML tool after the React/Vite migration. | 2026-03-27 | Updated governance, state, testing, product, and planning docs to match the current implementation. | `README.md`, `ARCHITECTURE.md`, `docs/STATE.md`, `docs/product-specs/knowledge-base.md` |
