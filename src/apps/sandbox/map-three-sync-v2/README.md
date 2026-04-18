# map-three-sync-v2

Second sandbox iteration for validating **MapLibre + Three.js sync** in a terrain-backed world.

## Why v2 exists next to v1

`map-three-sync-v1` remains untouched as the first milestone and comparison baseline:

- v1 focused on sync proof in a mostly flat world.
- v1 explored pitch behavior and optional fake-horizon treatment.

`map-three-sync-v2` is a separate prototype so both can be compared side-by-side without mixing concerns.

## v2 focus

This version evaluates whether real terrain improves spatial perception while preserving layer sync:

1. Fullscreen scene with shared `oc-map` + shared `oc-map-three-layer` architecture unchanged.
2. Real DEM terrain source enabled after `oc-map` is ready.
3. Terrain-friendly default camera around Innsbruck (mountainous area).
4. Reusable view presets: reset, flat, browse, spatial, horizon test.
5. Lightweight anchor controls: add anchors and clear anchors.
6. Optional (not primary) fake horizon toggle kept only for visual comparison.

## What to compare

### v1

- flat map bias
- fake horizon emphasis
- sync proof baseline

### v2

- terrain-backed world
- real horizon feeling from actual geometry
- sync proof under more realistic depth conditions

## Intentionally deferred (still out of scope)

- timeline integration
- anchored cards / story strip / narrative panel
- BAG tiles / custom buildings / relation overlays
- terrain height sampling for anchor elevation (altitude remains simple for now)

## Files

- `index.html` — fullscreen terrain scene and compact debug overlay.
- `app.js` — terrain setup, preset controls, viewport readouts, and anchor refresh actions.

## Run locally

From repository root:

1. `pnpm site:preview`
2. Open `http://localhost:4321/src/apps/sandbox/map-three-sync-v2/`
