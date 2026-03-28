# Quality Score

> Quality rating per module. Helps the agent judge which areas need extra care and which are safe to extend.
> Rating scale: A (Excellent) | B (Good) | C (Needs Improvement) | D (Problematic)
>
> **Last updated**: 2026-03-27

---

## Module Scores

| Module | Rating | Known Gaps |
| ------ | ------ | ---------- |
| App Shell / Shortcuts | B | `src/App.tsx` is small and clear, but global shortcuts are still coupled directly to controller shape. |
| Sprite Controller / Edit Pipeline | B- | `useSpriteSheet.ts` centralizes the app well, but it is large and mixes rendering, editing, animation, undo, and interaction state. |
| Viewport Interaction Layer | B | `SpriteViewport.tsx` cleanly owns pointer flows, but interaction branching is dense and depends heavily on shared mutable editor state. |
| Sidebar / Import / Export | B | `SpriteSidebar.tsx` is straightforward and feature-rich, but it owns many disparate controls and would benefit from eventual decomposition. |
| Documentation Alignment | C+ | Core docs are now more accurate, but this repo has a history of docs lagging behind implementation and needs continued maintenance discipline. |
| Automated Verification | C | Type-check and build verification exist, but there is still no dedicated automated test suite. |
