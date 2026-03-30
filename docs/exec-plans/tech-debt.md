# Tech Debt Tracking

> Centralized record of known tech debt. Review and repay periodically.
> Priority: 🔴 High (blocks development) | 🟡 Medium (affects quality) | 🟢 Low (nice to improve)
>
> **Last updated**: 2026-03-29

---

## Active Tech Debt

| # | Priority | Domain | Description | Impact | Link | Created |
| - | -------- | ------ | ----------- | ------ | ---- | ------- |
| 1 | 🟡 Medium | Shared constants | Behavioral defaults and tuning values were historically scattered across hooks and UI panels; a shared constants module now exists, but continued cleanup is still needed whenever new duplicated domain values appear. | Important editor defaults can drift between state setup, rendering, effects, and panel inputs if future changes skip the shared constants path. | `src/constants/spriteSheetConstants.ts` | 2026-03-29 |
| 2 | 🟡 Medium | Verification | Focused automated tests now exist for deterministic helpers, but interaction-heavy canvas editing flows still rely mainly on manual smoke tests. | Regressions in pointer interactions, canvas composition, and playback behavior are still easier to miss than pure helper regressions. | `docs/TESTING.md` | 2026-03-27 |
| 3 | 🟢 Low | Documentation process | The repo previously accumulated stale architecture/docs after the React migration; doc-sync discipline is now defined, but future tasks must keep following it. | Documentation can drift again if process is ignored. | `AGENTS.md` | 2026-03-27 |

---

## Resolved Tech Debt

| # | Domain | Description | Resolved | Resolution | Link |
| - | ------ | ----------- | -------- | ---------- | ---- |
| 1 | Documentation alignment | Multiple docs still described the app as a single-file vanilla HTML tool after the React/Vite migration. | 2026-03-27 | Updated governance, state, testing, product, and planning docs to match the current implementation. | `README.md`, `ARCHITECTURE.md`, `docs/STATE.md`, `docs/product-specs/knowledge-base.md` |
| 2 | Editor architecture | `src/hooks/useSpriteSheet.ts` had grown too large and mixed together rendering, effects, history, and destructive edit workflows. | 2026-03-29 | Split the controller into `spriteSheetCore.ts`, `spriteSheetRendering.ts`, `spriteSheetEffects.ts`, `spriteSheetHistory.ts`, and `spriteSheetEdits.ts` while keeping the public controller boundary stable. | `src/hooks/useSpriteSheet.ts`, `src/hooks/spriteSheetCore.ts`, `src/hooks/spriteSheetRendering.ts`, `src/hooks/spriteSheetEffects.ts`, `src/hooks/spriteSheetHistory.ts`, `src/hooks/spriteSheetEdits.ts` |
| 3 | Verification baseline | The repo lacked any dedicated automated test workflow for focused editor logic. | 2026-03-29 | Added Vitest-based unit tests for deterministic shared utility helpers and documented `npm run test` as part of the standard verification chain. | `docs/TESTING.md`, `src/utils/*.test.ts` |
