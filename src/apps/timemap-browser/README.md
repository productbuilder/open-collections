# Open Collections Timemap Browser App (Map-first v1 shell)

`timemap-browser` now uses a map-first overlay shell that keeps the map as the full stage while reserving top chrome, bottom timeline space, and selection detail overlays.

## Scope (this phase)

- full-stage `oc-map` composition for timemap shell
- top overlay chrome region with optional filter entry
- bottom timeline region reserved as a primary timemap control area (placeholder content for now)
- selection-driven detail overlay above the timeline region
- controller/state/query/spatial contracts preserved from scaffold iteration
- embedded shell-map-adapter bridge path from `open-collections-browse-shell`

## Not included yet

- full map adapter parity with all legacy behaviors
- full filter behavior
- reusable shared timeline slider implementation
- full cards/detail domain logic

## Run locally

From repository root:

1. `pnpm site:preview`
2. Open `http://localhost:4321/src/apps/timemap-browser/`

## Host configuration attributes (v1)

Set on `<timemap-browser>`:

- `show-top-chrome="true|false"`
- `show-timeline="true|false"`
- `show-detail-overlay="true|false"`
- `show-filter-entry="true|false"`
- `map-edge-to-edge="true|false"`
- `embed-density="comfortable|compact"`
- `map-clear-selection-on-background="true|false"`

Default behavior:

- standalone runtime: top chrome visible
- embedded runtime (`data-oc-app-mode="embedded"` or embed data attributes): top chrome hidden by default
- timeline + detail overlay regions remain enabled by default

## Manual verification

Desktop:

- The map should fill the entire app stage.
- Top overlay chrome should render with timemap summary text.
- Bottom timeline placeholder should remain visible.
- Clicking a map feature should open the bottom detail overlay and highlight selection.
- Clicking "Close" or "Clear selection" should close detail and clear map selection.

Mobile:

- Timeline placeholder stays pinned at bottom edge.
- Detail opens as a bottom-sheet-like overlay above timeline.
- Tapping map background should clear selection (default mobile behavior).

Configurability:

- Toggle `show-top-chrome`, `show-timeline`, and `show-detail-overlay` attributes and verify overlay visibility changes.

## Internal structure (this phase)

- `src/state/initial-state.js` defines the app-local state shape and seeds query defaults from `src/shared/data/query/collection-query-contract.js`.
- `src/controllers/timemap-browser-controller.js` orchestrates state updates (`subscribe`, `setFilters`, `setTimeRange`, `setViewport`, selection handling, etc.) and can apply shell-provided spatial responses.
- `src/app.js` resolves runtime/host presentation config and wires controller state/events to shell.
  - In embedded `data-shell-map-adapter="true"` mode, it consumes `browse-shell-map-projection` and does not run local ingestion.
  - Non-shell fallback remains fixture-backed for standalone shell development, but no longer fetches manifests or owns collection ingestion.
- `src/components/timemap-browser-shell.js` owns map-first visual composition and overlay stacking while delegating non-visual orchestration to the controller.
