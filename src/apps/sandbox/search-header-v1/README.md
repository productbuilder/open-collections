# search-header-v1

Versioned sandbox prototype for a mobile-first **Open Collections browser header** that now mirrors the real in-app layout more closely.

## What this version is testing

This version moves away from a standalone demo card and instead mocks an in-context browser screen:

- Floating header controls over full-screen content
- Default one-row controls: **Search + Filters + Map/List**
- Search-focused expansion behavior with a back affordance
- Background content switching between realistic map-style and list/grid-style previews

## Real-app alignment goals

- Header controls sit directly on top of content, near the top edge.
- Content fills the full screen behind the controls.
- Rounded pill controls and search input match mobile collection browser patterns.
- Filters uses a sliders/settings icon and text label.
- Map/List toggle changes underlying preview mode so interaction feels real.

## Key interaction behavior

- **Default state:** one row with search as the widest control, then Filters and Map/List to the right.
- **Search active:** tapping/focusing search expands it with a back button; Filters and Map/List move to a secondary row.
- **Back/Escape:** collapses the expanded search state.
- **Filters:** toggles a demo active filter count and visual active state.
- **Map/List:** toggles preview background between map-like and collection-results-like layouts.
- **Typed query:** reflected in the live state summary for quick iteration checks.

## Files

- `index.html` — page shell and visual system for floating controls + realistic full-screen previews
- `app.js` — state model, render logic, and interaction handlers
