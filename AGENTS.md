# AGENTS.md

## ⛔ Hard Rules (Must follow on every task, no exceptions)

1. **Read the repo docs first.** Before changing code, read the relevant docs from the "Repository Knowledge Map" below so your work matches the current architecture and product behavior.
2. **Plan before non-trivial execution.** For multi-file features, architectural changes, or behavior changes, present the intended files and approach first and wait for approval.
3. **Docs must ship with code.** Any change to product behavior, architecture, commands, workflow, or plan status must update the relevant docs in the same task.
4. **Keep indexes and status docs consistent.** When adding, moving, or reclassifying docs, update the corresponding `index.md`, `STATE.md`, and `DECISIONS.md` entries where applicable.
5. **Self-review before handoff.** Before declaring a task complete, verify the implementation, verify docs, and summarize what changed.

> Skipping relevant documentation updates means the task is incomplete.

---

## Repository Knowledge Map

### Architecture & Quality

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Current module structure, layering, and editing pipeline
- **[docs/STATE.md](docs/STATE.md)** — Current runtime/deployment snapshot and known limitations
- **[docs/DECISIONS.md](docs/DECISIONS.md)** — Important historical decisions and trade-offs
- **[docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md)** — Quality assessment by current module boundary
- **[docs/TESTING.md](docs/TESTING.md)** — Verification strategy and current testing reality

### Product Knowledge

- **[docs/product-specs/knowledge-base.md](docs/product-specs/knowledge-base.md)** — Core feature map, key file ownership, and state model
- **[docs/product-specs/glossary.md](docs/product-specs/glossary.md)** — Canonical project terminology
- **[docs/product-specs/product-roadmap.md](docs/product-specs/product-roadmap.md)** — High-level roadmap and current priorities

### Design Documents

- **[docs/design-docs/index.md](docs/design-docs/index.md)** — Design document index and status overview

### Execution Plans

- **[docs/exec-plans/index.md](docs/exec-plans/index.md)** — Execution plan index (active/completed)
- **[docs/exec-plans/tech-debt.md](docs/exec-plans/tech-debt.md)** — Centralized tech debt tracking

### Templates

- **[docs/templates/design-doc.md](docs/templates/design-doc.md)** — Design doc template
- **[docs/templates/exec-plan.md](docs/templates/exec-plan.md)** — Execution plan template

---

## Common Commands

- **Install**: `npm install`
- **Run Dev Server**: `npm run dev`
- **Build**: `npm run build` (emits relative `./` asset paths for static hosting)
- **Preview Production Build**: `npm run preview`
- **Type Check**: `npm exec tsc --noEmit`
- **Tests**: No dedicated automated test script is configured yet

## Tech Stack

- **Runtime**: Browser
- **App Type**: React 19 + Vite + TypeScript frontend
- **UI**: Arco Design + Tailwind CSS
- **Rendering**: HTML5 Canvas (`image-rendering: pixelated`)
- **Primary Entry**: `index.html` + `src/main.tsx`
- **Historical File**: `sprite-editor.html` is historical/reference only, not the main workflow

## Coding Rules

- **Architecture**: Shared editor state is created once in `useSpriteSheet()` and passed down from `src/App.tsx`.
- **Ownership**: The shared sprite editor controller lives in `src/hooks/useSpriteSheet.ts`; shell and presentation components should stay thin.
- **Business-code aggregation**: For `src/` business feature code, keep cohesive feature workflows easy to find, but it is acceptable to split a controller into a small set of shared modules under `src/types/` and `src/utils/` when that materially improves ownership.
- **File-size bias**: For business code, cohesive files over 300 lines are acceptable when they keep one workflow discoverable in one place; this does not apply to entrypoints, tests, docs, styles, or other non-business files.
- **Helper extraction**: Extract a new helper or abstraction when reuse, isolated test value, or a clearer controller boundary justifies it.
- **Viewport/UI split**: Pointer interaction belongs in `SpriteViewport.tsx`; controls/import/export belong in `SpriteSidebar.tsx` and `SpriteRightPanel.tsx`.
- **Styling**: Preserve the current dark theme and existing Arco + Tailwind patterns.
- **Canvas rendering**: Keep `image-rendering: pixelated` for sprite clarity.
- **Dependencies**: Reuse the current stack. Do not add new dependencies unless the task clearly requires them.

## Testing Rules

- There is no established automated test suite yet.
- For now, verification is primarily:
  - `npm exec tsc --noEmit`
  - `npm run build`
  - targeted manual smoke tests for affected features
- If a task introduces isolated pure logic that can be tested cheaply, prefer adding focused tests rather than broad UI mocks.

## Development Workflow

### Documentation-Driven Rule (Mandatory)

Before starting a task:
- Read the relevant docs from the knowledge map.
- Check current code paths before trusting older docs.

After completing a task, update docs in the same change when relevant:
- **User-visible feature changes** → Update `README.md` and `docs/product-specs/knowledge-base.md`
- **Architecture / module ownership changes** → Update `ARCHITECTURE.md`
- **Runtime / deployment / limitations changes** → Update `docs/STATE.md`
- **Verification workflow changes** → Update `docs/TESTING.md`
- **Quality posture changes** → Update `docs/QUALITY_SCORE.md`
- **Roadmap / product direction changes** → Update `docs/product-specs/product-roadmap.md`
- **Completed plans / historical decisions** → Update `docs/DECISIONS.md`
- **New or reclassified design docs / exec plans** → Update the doc itself and its `index.md`
- **New tech debt discovered** → Update `docs/exec-plans/tech-debt.md`

### Minimum doc-sync checklist

For every non-trivial code change, confirm all of the following before handoff:
- [ ] Did behavior change for users?
- [ ] Did file ownership or architecture change?
- [ ] Did commands, setup, or build workflow change?
- [ ] Did plan status or historical context change?
- [ ] Did I update the relevant docs or explicitly confirm none were needed?

### When to create a Design Doc

Create a new doc in `docs/design-docs/` when:
- introducing a new subsystem or major editing mode
- changing dependency directions or component ownership across modules
- evaluating multiple viable architectural approaches
- adopting a new dependency or platform-level technology

### When to create an Exec Plan

Create a new doc in `docs/exec-plans/active/` when:
- work spans multiple files/modules with ordered steps
- a change is large enough that execution sequencing matters
- reclassification, migration, or rollout status needs to be tracked over time

### Index maintenance

Whenever you add, move, rename, or reclassify a document under `docs/`, update the corresponding `index.md` in the same task.

### Task Completion Criteria

A task is complete only when all of the following are true:
1. Relevant implementation changes are finished
2. Verification was run at the appropriate level for the change
3. All affected docs are updated, or you explicitly verified that no doc changes were needed
4. Any affected indexes / status docs are consistent
5. The final handoff clearly states what changed

## Git Workflow

- Prefer feature branches and PRs over working directly on `main`
- Keep commits focused and keep docs updates in the same change as the code they describe
