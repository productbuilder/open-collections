# map-three-sync-v1

Sandbox experiment to validate a **shared companion primitive architecture**:

- `oc-map` remains the MapLibre world owner.
- `oc-map-three-layer` becomes a reusable Three.js scene companion.
- the sandbox app acts as a focused test harness.

## What this prototype proves

1. A shared `oc-map-three-layer` can attach to an existing shared `oc-map`.
2. The layer can wait for `oc-map-ready`, read `mapElement.mapInstance`, and register a MapLibre custom 3D layer.
3. Anchored Three.js objects stay aligned while panning, zooming, rotating, and pitching.
4. A tiny API (`setAnchors`, `clearScene`) is enough for first integration and future growth.

## Intentionally not implemented yet

- 3D tiles
- custom buildings pipeline
- cards in space
- story layers / paths
- relation lines

Those are future milestones. This v1 is only the first structural proof-of-alignment step.

## Files

- `index.html` — static sandbox shell + map + debug controls.
- `app.js` — wiring for map events, layer API calls, and debug actions.

## Run locally

From repository root:

1. `pnpm site:preview`
2. Open `http://localhost:4321/src/apps/sandbox/map-three-sync-v1/`
