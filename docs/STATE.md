# Application State

> This document is a snapshot of the application's current real state. **Only keep the latest state, no history.**
> Agent should read this file at the start of each new session to avoid making wrong assumptions based on common knowledge.
>
> **Last updated**: YYYY-MM-DD

---

## Deployment & Runtime

| Item            | Current State                          |
| --------------- | -------------------------------------- |
| **Platform**    | Local / Static Hosting                 |
| **Runtime**     | Web Browser                            |
| **Output mode** | Standalone HTML File                   |
| **Region**      | N/A                                    |
| **Domain**      | N/A                                    |

---

## Key Infrastructure

| Service              | Provider | Purpose |
| -------------------- | -------- | ------- |
| **Database**         | N/A      | Pure client-side tool |
| **Auth**             | N/A      | No authentication needed |
| **Storage**          | N/A      | In-memory (FileReader API) |
| **Payments**         | N/A      | Free open-source tool |
| **Error monitoring** | N/A      | Console only |
| **Logging**          | N/A      | Console only |
| **Analytics**        | N/A      | None |

---

## Known Production Limitations

| Limitation | Impact | Reference |
| ---------- | ------ | --------- |
| Single File Size Limit | Extremely large images may crash the browser tab | N/A |

---

## Current Feature Status

### Core Features (Live)

- ✅ Image Import (PNG, JPG, WEBP, GIF) via drag-and-drop or selection
- ✅ Sprite parameters configuration (W, H, Offset, FPS)
- ✅ Auto-detection of sprite layout & grid overlay
- ✅ Zoom and pan controls with pixelated rendering
- ✅ Real-time animation preview and frame strip viewing
- ✅ Selection tools (Pan, Rectangle, Lasso)
- ✅ Export options (Selection, Frame, All Frames)

### Support Systems (Live)

- ✅ Responsive Canvas Adjustment
- ✅ Pure CSS Dark Mode UI

### Active Tech Debt

See [tech-debt.md](exec-plans/tech-debt.md) for details.
