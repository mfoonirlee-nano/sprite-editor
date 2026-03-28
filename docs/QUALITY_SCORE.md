# Quality Score

> Quality rating per module. Helps the agent judge which areas need extra care and which are safe to extend.
> Rating scale: A (Excellent) | B (Good) | C (Needs Improvement) | D (Problematic)
>
> **Last updated**: 2026-03-28

---

## Module Scores

| Module | Rating | Known Gaps |
| ------ | ------ | ---------- |
| App Shell / Shortcuts | B | `src/App.tsx` is small and clear, but global shortcuts are still coupled directly to controller shape. |
| Sprite Controller / Edit Pipeline | B | `src/hooks/useSpriteSheet.ts` is now the shared controller entrypoint, with types centralized in `src/types/` and helpers centralized in `src/utils/`; the editing pipeline is clearer, but the main hook still carries dense stateful orchestration that needs careful edits. |
| Viewport Interaction Layer | B | `SpriteViewport.tsx` cleanly owns pointer flows, but interaction branching is dense and depends heavily on shared mutable editor state. |
| Sidebar / Import / Export | B | `SpriteSidebar.tsx` and `SpriteRightPanel.tsx` are cohesive feature panels; keep them grouped by feature and avoid splitting them into micro-files without a strong reason. |
| Documentation Alignment | C+ | Core docs are now more accurate, but this repo has a history of docs lagging behind implementation and needs continued maintenance discipline. |
| Automated Verification | C | Type-check, lint, unit tests, and build verification exist, but broad automated coverage is still limited. |
