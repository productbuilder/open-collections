# Collection-browser selective architecture pass (2026-03)

## What this pass addressed

This pass made a targeted, low-risk alignment of `collection-browser` with the app-shell-family hierarchy and shared UI direction.

Primary changes:

- reduced browser dependence on `collection-manager` shell-specific UI wrappers
- shifted page section composition toward the shared panel layer
- adopted shared empty-state primitive usage in browser-local panels

## Structure issues addressed

- Removed browser reliance on manager-local shell wrappers (`open-panel-shell`, `open-pane-layout`) in favor of browser-local page layout plus shared section panel composition.
- Kept browser page ownership in app-local components while reducing shell-like chrome duplication inside the browser viewport component.
- Preserved standalone mode by keeping the lightweight browser app header in `timemap-browser`, while keeping browser page composition scoped to browser components.

## Shared layers adopted in browser

- `open-collections-section-panel`
  - now wraps the browser viewport content and metadata grouping
- `open-collections-empty-state`
  - now used for item-grid empty state
  - now used for metadata panel empty state

## Intentionally left browser-local (for safety)

- Manifest input/recent URL workflow and event orchestration in `open-browser-manifest-controls`
- Item-grid card rendering/selection/viewer interactions in `open-browser-item-card-grid`
- Browser-specific mobile metadata open/close behavior and viewer dialog behavior

These areas are workflow-heavy and still better kept app-local until broader cross-app reuse is proven.

## Safest next cleanup step

Extract a small browser-local `open-browser-page` component (or equivalent) that owns top-level page composition currently split between `timemap-browser` and `open-browser-collection-browser`, while keeping runtime/controller logic unchanged.

That step would further clarify Shell vs Page boundaries without forcing a broad rewrite.
