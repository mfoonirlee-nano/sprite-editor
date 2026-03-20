# Architecture

> This document is the architecture map of the codebase.
> The agent should understand module structure and dependency rules here before diving into specific code.
>
> **Last updated**: YYYY-MM-DD

---

## High-level Architecture

The Sprite Editor is a pure client-side web application built in a single HTML file (`sprite-editor.html`). 
It relies heavily on the HTML5 Canvas API for rendering images and pixel data, and uses vanilla JavaScript to handle user interactions, state management, and file exports.

```text
User Input (UI Controls, Mouse Events) 
  → State Management (Vanilla JS variables)
  → Rendering Engine (HTML5 Canvas)
  → Export/Download (Browser Blob API)
```

---

## Directory Structure & Responsibilities

```text
/
├── sprite-editor.html  # The entire application (UI, CSS styles, and JS logic)
├── package.json        # Project metadata
└── README.md           # Project documentation
```

---

## Layering Rules

Because the project is encapsulated within a single HTML file, there are no strict multi-file layering rules. However, the logical separation within `sprite-editor.html` is:
1.  **HTML Structure**: Defines the layout and UI components.
2.  **CSS Styling**: Defines the dark theme and responsive layout.
3.  **JavaScript Logic**: Handles event listeners, canvas manipulation, and state updates.

---

## Cross-cutting Concerns

- **State Management**: Handled via global variables within the script tag.
- **Rendering**: Optimized for pixel art using `image-rendering: pixelated`.
- **File Handling**: Uses the FileReader API for importing images and the Blob/URL APIs for exporting generated sprite sheets or frames.

---

## Key Conventions

- **Zero Dependencies**: The project must remain dependency-free (no npm packages, no build steps).
- **Vanilla JS**: All logic must be written in standard, modern JavaScript supported by modern browsers.
