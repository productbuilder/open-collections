# map-horizon-v1

Minimal sandbox to replicate the official MapLibre **sky + fog + terrain** setup while using the shared `oc-map` primitive.

## Purpose

This experiment isolates one visual question: does a terrain-backed, high-pitch MapLibre scene produce a convincing horizon feel?

The sandbox intentionally excludes product UI complexity (cards, timeline, and Three.js) so the atmosphere and depth cues can be evaluated on their own.

## What is implemented

- Fullscreen `oc-map` stage with minimal overlay controls.
- `oc-map-ready` listener that configures MapLibre terrain runtime settings.
- Raster DEM source + `setTerrain(...)` for 3D relief.
- `hillshade` layer for stronger terrain depth perception.
- `setSky(...)` configuration inspired by the Rekichizu horizon tuning profile.
- Pitch presets (`0`, `30`, `50`, `70`) to compare horizon readability quickly.

## Key insight being validated

- Fog blending is most useful over terrain rather than a flat map.
- Terrain creates depth cues that make horizon transitions believable.
- Camera pitch controls whether the horizon effect is visible and immersive.

## Next steps

1. Lift the best sky/fog/terrain defaults into the main explorer map experience.
2. Re-introduce `oc-map-three-layer` for 3D companion experiments after horizon baseline is validated.
3. Add timeline and card overlays later, once atmospheric quality is confirmed.

## Run locally

From repository root:

1. `pnpm site:preview`
2. Open `http://localhost:4321/src/apps/sandbox/map-horizon-v1/`
