# Application State

> This document is a snapshot of the application's current real state. **Only keep the latest state, no history.**
> Agent should read this file at the start of each new session to avoid making wrong assumptions.
>
> **Last updated**: 2026-03-29

---

## Deployment & Runtime

| Item            | Current State                          |
| --------------- | -------------------------------------- |
| **Platform**    | Local / Static Hosting                 |
| **Runtime**     | Web Browser                            |
| **Output mode** | Vite-built static frontend application with relative `./` asset paths |
| **Region**      | N/A                                    |
| **Domain**      | N/A                                    |

---

## Key Infrastructure

| Service              | Provider | Purpose |
| -------------------- | -------- | ------- |
| **Database**         | N/A      | Pure client-side tool |
| **Auth**             | N/A      | No authentication needed |
| **Storage**          | N/A      | In-memory browser state only |
| **Payments**         | N/A      | Free local tool |
| **Error monitoring** | N/A      | Browser console only |
| **Logging**          | N/A      | Browser console only |
| **Analytics**        | N/A      | None |

---

## Known Limitations

| Limitation | Impact | Reference |
| ---------- | ------ | --------- |
| Large images are memory-heavy | Very large images may cause sluggish interaction or browser tab instability | `src/hooks/useSpriteSheet.ts` |
| No persistence layer | Reloading the page loses in-memory editing state | Current app architecture |
| Automated coverage is still limited | Focused helper tests exist, but interaction-heavy canvas workflows still depend on manual smoke testing in addition to type/lint/test/build checks | `docs/TESTING.md` |

---

## Current Feature Status

### Core Features (Live)

- ✅ Image import via click, drag-and-drop, and paste
- ✅ Viewport pan and wheel zoom with pixelated rendering
- ✅ Rectangle and lasso selection tools
- ✅ Selection move and commit back into the image
- ✅ Frame configuration (width, height, count, FPS, offsets)
- ✅ Grid overlay and frame strip preview
- ✅ Animation preview playback
- ✅ Background color sampling and tolerance-based background removal
- ✅ Canvas resize without stretching, including anchor-based crop/pad behavior
- ✅ Undo for destructive image edits
- ✅ Export current selection and current frame

### Support Systems (Live)

- ✅ Shared React controller architecture via `useSpriteSheet()`
- ✅ Arco Design + Tailwind dark UI
- ✅ Vite dev/build workflow

### Historical Notes

- `sprite-editor.html` may still exist in the repo, but it is not the current main workflow.
- Current app entry is `index.html` + `src/main.tsx`.

### Active Tech Debt

See [tech-debt.md](exec-plans/tech-debt.md) for details.
