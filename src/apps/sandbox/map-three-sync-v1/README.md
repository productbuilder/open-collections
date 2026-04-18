# map-three-sync-v1

Sandbox experiment to validate a **shared companion primitive architecture**:

- `oc-map` remains the MapLibre world owner.
- `oc-map-three-layer` remains the reusable Three.js scene companion.
- the sandbox app remains a focused test harness for scene feel.

## What this prototype now focuses on

This iteration is tuned for quick evaluation of **spatial feel**, **pitch control**, and **horizon visibility**:

1. Full-screen map stage with compact debug overlays.
2. Sandbox-only pitch controls (slider + presets) for immediate comparison.
3. Non-flat default reset view (mild spatial baseline).
4. A stronger horizon test preset (high pitch + wider view).
5. Depth-readability anchors with near / mid / far references.

## View presets

- **Reset view**: mild spatial baseline (`pitch: 40`, slight bearing).
- **Flat**: analytical baseline (`pitch: 0`).
- **Browse**: medium pitch (`pitch: 33`).
- **Spatial**: stronger spatial read (`pitch: 48`).
- **Horizon test**: strong pitch and wider framing (`pitch: 58`, lower zoom).

## Debug overlay actions

- readouts: center, zoom, pitch, bearing
- controls:
  - reset view
  - add anchors
  - clear anchors
  - flat
  - browse
  - spatial
  - horizon test
  - pitch slider (`0` to `60`)

## Intentionally not implemented yet

- 3D tiles
- custom buildings pipeline
- cards in space
- story layers / paths
- relation lines

Those remain future milestones. This sandbox continues to focus on scene alignment and feel testing only.

## Files

- `index.html` — full-screen map stage + compact overlay controls.
- `app.js` — preset logic, pitch slider wiring, depth anchor setup, and debug actions.

## Run locally

From repository root:

1. `pnpm site:preview`
2. Open `http://localhost:4321/src/apps/sandbox/map-three-sync-v1/`
