# dialog-flow-v1

Versioned sandbox prototype for a reusable **dialog-based guided flow** pattern.

## What this is

This app explores a lightweight step-by-step decision flow UI that could later become a reusable Open Collections component.

## Why it is in `src/apps/sandbox`

- It is intentionally experimental and versioned (`v1`).
- It allows fast UX iteration without coupling to production app-shell integration.
- It isolates pattern discovery before implementation hardening.

## Prototype behavior

- Centered dialog panel with progressive step indicator.
- Option-card selections that persist while navigating between steps.
- Required-choice gating (Next disabled until selected when required).
- Optional expandable per-step “more info” section.
- Final confirm step showing selected answers and JSON preview.
- Keyboard support:
  - `Escape` closes/reset flow
  - `Enter` advances when next is allowed

## Files

- `index.html` — UI shell + prototype styles
- `data.js` — structured step definitions
- `app.js` — rendering, state management, and interaction logic
