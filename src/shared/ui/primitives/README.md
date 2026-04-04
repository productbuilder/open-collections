# Shared UI primitives (first pass)

This folder holds the first modest set of app-shell family shared primitives.

## Included now

- `open-collections-section-header`
  - Low-level section/page heading row with optional leading/actions slots.
- `open-collections-empty-state`
  - Low-level empty/placeholder callout with optional title and message.
- `open-collections-action-row`
  - Reusable full-width navigation/action row with leading icon, title/subtitle, optional trailing arrow, and optional secondary trailing slot control.
- `oc-grid`
  - Reusable slotted layout container only (grid/list mode, responsive columns, gaps).
  - Parent/view-layer code provides light-DOM children (for example card components) and `oc-grid` lays them out.
  - Optional per-item span vars are supported via `data-span-cols` and `data-span-rows` on slotted children.
  - Backward-compatible alias: `open-collections-card-layout` (to support incremental migration).
- `open-collections-preview-summary-card`
  - Reusable whole-card action surface with title/subtitle, thumbnail preview strip, and summary count label for browse/discovery cards.
- `oc-card-collections`
  - Semantic shared card for multi-collection roots (collections source card surface).
- `oc-card-collection`
  - Semantic shared card for a collection browse surface.
- `oc-card-item`
  - Semantic shared card for an item browse surface.
- `oc-map`
  - Generic shared map primitive powered by MapLibre GL JS (loaded from CDN at runtime; no package install needed).
  - Supports initial map config via attributes (`style-url`, `center`, `zoom`).
  - Exposes imperative methods (`setGeoJsonData`, `setLayerVisibility`, `fitToBounds`, `fitToData`, `highlightFeature`).
  - Emits `oc-map-ready`, `oc-map-feature-click`, `oc-map-viewport-change`, and `oc-map-error` (for loader/init failures).

## Why these first

These patterns already repeat across `app-shell`, `collection-account`, and `collection-presenter`, and are simple enough to standardize without pulling app-specific workflow logic into shared code.

## Intentionally left for later

- App/domain panels (`connections-list`, provider setup flows, manager/browser workflows)
- Larger page compositions
- Speculative abstractions that are not yet stable across apps

## Primitive vs panel guidance

Use a **primitive** when the unit is a small, reusable visual building block.
Use a **panel** when the unit owns grouped domain behavior/composition.
Keep app-specific workflows local until repeated cross-app usage is clear.
