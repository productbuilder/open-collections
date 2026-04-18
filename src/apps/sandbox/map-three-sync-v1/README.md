# map-three-sync-v1

Sandbox experiment to validate a **shared companion primitive architecture**:

- `oc-map` remains the MapLibre world owner.
- `oc-map-three-layer` remains the reusable Three.js scene companion.
- the sandbox app coordinates timeline state, active focus state, helper UI state, and demo data.

## What this prototype now focuses on

This milestone shifts from pure scene debugging into the first **timeline + anchored card** concept test:

1. Full-screen map stage with existing pitch/horizon treatment intact.
2. Debug/helper panel collapsed by default behind a small **Debug** chip.
3. Bottom timeline overlay with scrubbable year control (`1850`–`2020`).
4. Small time-aware demo dataset (10 clustered items around Utrecht center).
5. Timeline-driven active item selection (nearest item by year).
6. One dominant focused card that appears anchored above the active item's location.
7. Non-active items remain simple scene anchors for readability.
8. Optional map click-to-focus interaction (timeline updates to clicked anchor's year).

## Interaction model

- **Primary controller:** timeline scrubber.
- **Active item rule:** nearest dataset item to selected year.
- **Scene behavior:** active item receives stronger anchor treatment; non-active anchors remain lighter and are temporally windowed.
- **Card behavior:** active item is rendered as a lightweight DOM card projected above map coordinates, preserving map context below.
- **Debug behavior:** all prior controls remain available but are visually secondary.

## Debug overlay actions

- readouts: center, zoom, pitch, bearing
- controls:
    - fake horizon toggle (ON/OFF comparison)
    - reset view
    - refresh anchors
    - clear anchors
    - flat
    - browse
    - spatial
    - horizon test
    - pitch slider (`0` to `60`)

## Intentionally not implemented yet

- story mode / story strip
- full product chrome / narrative side panel
- card deck or multi-card stack
- relation graph / lines
- 3D tiles or custom buildings pipeline

## Files

- `index.html` — full-screen stage, collapsed helper UI, bottom timeline, and active card shell.
- `app.js` — demo dataset, timeline state, active-item selection, anchor refresh logic, and focused card projection.

## Run locally

From repository root:

1. `pnpm site:preview`
2. Open `http://localhost:4321/src/apps/sandbox/map-three-sync-v1/`
