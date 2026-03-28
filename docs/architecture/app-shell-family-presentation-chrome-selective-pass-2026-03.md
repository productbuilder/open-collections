# App-shell family presentation chrome selective pass (2026-03)

## What this pass extracted

A small shared presentation-only panel chrome was added:

- `open-collections-panel-chrome` (`src/shared/ui/panels/chrome-panel.js`)
  - title row with optional back button
  - optional subtitle/status chip presentation
  - optional header action slot
  - toolbar row with main/actions slots
  - body/content slot
  - emits `panel-back` for host-owned navigation handling

This extraction is intentionally visual-only and does not own workflow state or controller logic.

## Why this seam was safe to share now

This exact chrome structure was already present in manager-local `open-panel-shell` and adjacent browser/manager composition needs:

- title/subtitle + optional back affordance
- toolbar/action row directly under title
- content region below chrome

The structure is stable, app-agnostic, and reusable without introducing business abstractions.

## Incremental adoptions included

- `collection-manager`
  - `open-collections-browser` now uses `open-collections-panel-chrome` for its title/toolbar/content wrapper.
- `collection-browser`
  - `open-browser-collection-browser` now uses `open-collections-panel-chrome` for viewport title/subtitle + toolbar + content frame.

## Intentionally left local

Kept local by design in this pass:

- manager workflow orchestration/state transitions
- browser manifest/recent-url workflow and event sequencing
- item-grid/selection/viewer interaction logic
- connection/source/publish behavior

These remain app/workflow concerns rather than presentational chrome concerns.

## Next safest cleanup step

Extract only low-risk shared header-row micro-primitives if repetition grows (for example a shared status-line row or simple action strip), while continuing to keep orchestration and behavior local to manager/browser components.
