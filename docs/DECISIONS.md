# Decision Log

> Agent should read this file at the start of each new session to quickly understand historical decision context.
> Each record corresponds to a completed exec plan or major repo-level decision, focusing on "why" and "key trade-offs".
>
> **Last updated**: 2026-03-27

---

## Decision Records

### E1 — React 19 + Vite + TypeScript Frontend Refactor (2026-03-27)
- **What changed**: The project moved from a legacy single-file HTML implementation to a React 19 + Vite + TypeScript frontend with Arco Design, Tailwind CSS, and a shared sprite-editor controller.
- **Why**: The old structure was difficult to extend and maintain as editing workflows became more interactive and stateful.
- **Key trade-offs**: The repo gained a modern component structure, build tooling, and clearer ownership boundaries, but also added dependency and toolchain complexity.
- **Not done / Remaining**: The core controller is still large, automated tests are still limited, and several docs required post-migration cleanup to fully match the new architecture.
- **Details**: `docs/exec-plans/active/E1-react-frontend-refactor.md`
