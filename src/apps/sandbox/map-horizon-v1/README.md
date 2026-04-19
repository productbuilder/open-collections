# map-horizon-v1

Sandbox baseline that reproduces the official MapLibre **Sky + Fog + Terrain** horizon behavior while reusing `oc-map` without modifying it.

## What this sandbox does

- Waits for `oc-map-ready`, then configures the map via `mapInstance`.
- Adds DEM sources exactly like the MapLibre example (`terrainSource` + `hillshadeSource`).
- Applies `setTerrain({ source: 'terrainSource', exaggeration: 1.0 })`.
- Adds a hillshade layer (`id: 'hills'`) for depth cues.
- Forces the camera to the horizon-friendly view:
    - center: `[11.2953, 47.5479]`
    - zoom: `9`
    - pitch: `75`
    - bearing: `20`
- Applies the example-aligned `setSky(...)` values for sky/horizon/fog blending.

## Why the horizon appears

You do not directly “turn on” a horizon.

The horizon appears when these conditions are combined:

1. 3D terrain is enabled.
2. Camera pitch is high enough to see far distance.
3. Zoom is low enough to include distant terrain.
4. Sky + fog blending can then transition naturally as:
   **terrain → fog → horizon → sky**.

If you only see terrain, the camera is usually too flat or too zoomed in.

## Debug camera presets

Buttons in the overlay help validate behavior quickly:

- **Flat**: pitch `0`, zoom `12`
- **Browse**: pitch `30`, zoom `11`
- **Spatial**: pitch `50`, zoom `10`
- **Horizon**: pitch `75`, zoom `9`

The **Horizon** preset should make the sky band and fog transition visibly clear.

## Run locally

From repository root:

1. `pnpm site:preview`
2. Open `http://localhost:4321/src/apps/sandbox/map-horizon-v1/`
