# Open Collections Timemap Browser App (Scaffold)

`timemap-browser` is the first app-level scaffold for a future timemap browsing experience.

## Scope (this phase)

- app bootstrapping + registration as a web-component app
- layout composition for filters, map, timeline, and detail/cards placeholders
- shared `oc-map` primitive mounted with a practical development default view (Hilversum)

## Not included yet

- production data loading and map layers
- full filter behavior
- full timeline interactions
- full cards/detail logic

## Run locally

From repository root:

1. `pnpm site:preview`
2. Open `http://localhost:4321/src/apps/timemap-browser/`

## Manual verification

- The app should render a titled scaffold page.
- The filter, timeline, and detail/cards areas should show placeholder content.
- The map area should render a working `oc-map` centered around Hilversum.

## Internal structure (this phase)

- `src/state/initial-state.js` defines a practical app-local state shape and seeds query defaults from `src/shared/data/query/collection-query-contract.js` for:
  - filters
  - time range
  - selection/hover
  - overlays
  - viewport
  - spatial loading request/response scaffold via `src/shared/data/spatial/spatial-query-contract.js`
- `src/controllers/timemap-browser-controller.js` provides lightweight orchestration helpers (`subscribe`, `setFilters`, `setTimeRange`, `setViewport`, etc.) and keeps a normalized shared `query` snapshot in sync.
- `src/app.js` wires the controller to the shell component so rendering stays in UI components while state/orchestration stays app-local.
