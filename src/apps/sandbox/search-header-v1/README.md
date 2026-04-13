# search-header-v1

Versioned sandbox prototype for a mobile-first **collection-browser header** pattern that combines search + filters + map/list view switching.

## What this is

This prototype explores a compact Open Collections header that supports fast searching while still keeping key browse actions available:

- Search field
- Filters button (with a settings/sliders icon)
- Map/List view switch button

## Why it is in `src/apps/sandbox`

- It is intentionally experimental and versioned (`v1`).
- It supports rapid UX iteration before app-shell integration.
- It isolates interaction details so behavior can be tested and discussed quickly.

## Key interaction behavior

- Default (compact) layout shows search + Filters + Map/List on one row.
- Focusing/tapping search expands the header into a two-row state:
  - Row 1: back/close affordance + dominant search field
  - Row 2: Filters and Map/List actions
- Back/close (or `Escape`) collapses search to compact layout.
- Filters toggles a demo active-filter count and active visual styling.
- Map/List toggles between list and map modes.
- Typing in search updates fake result text and the debug state summary.

## Files

- `index.html` — sandbox page shell and all prototype CSS
- `app.js` — in-memory state, render function, and interaction handlers
