# maplibre-sky-fog-terrain-baseline-v1

Baseline verification sandbox for a natural-looking MapLibre **Sky, Fog, Terrain** atmosphere.

- Official example reference: https://maplibre.org/maplibre-gl-js/docs/examples/sky-fog-terrain/

## Purpose

This sandbox is intentionally isolated and uses **raw `maplibregl.Map(...)`** directly.

It exists to verify a clean atmospheric baseline that can later support timeline/cards/story layers.

## Intentional constraints

This sandbox deliberately does **not** use:

- `oc-map`
- `oc-map-three-layer`
- shared map abstractions
- timeline/cards/story UI

## What is included

- MapLibre CSS and JS from CDN
- Inline style object with:
  - OSM raster base source
  - terrain raster-dem source
  - separate hillshade raster-dem source
  - terrain enabled in style (`exaggeration: 0.8`)
  - hillshade layer enabled
- `map.setSky(...)` tuned for soft natural atmosphere
  - light blue sky
  - white horizon
  - white fog
  - stronger horizon/fog blending for earlier horizon perception
- Minimal preset controls:
  - Flat
  - Browse
  - Spatial
  - Horizon
- Vertical FOV testing controls:
  - slider with live FOV readout
  - FOV preset buttons (**Default 36.87**, **Wide 45**, **Wider 50**)
  - horizon comparison buttons for default and wider FOV values
- `Sky enabled` checkbox

## FOV testing note

Field of view (FOV) controls how much vertical scene area the camera captures.

- MapLibre default vertical FOV is `36.87`.
- This sandbox tests wider values (`45` and `50`) to evaluate whether the horizon appears earlier/stronger and whether depth perception feels more dramatic.

## Visual notes

- The horizon is controlled by **camera + fog blending**, not by a fixed geometric line.
- “Earlier horizon” perception is achieved by tuning fog blends (`fog-ground-blend`, `horizon-fog-blend`, `sky-horizon-blend`), not by shifting geometry.
- This version approximates the targeted Rekichizu-style atmospheric read:

`terrain → fog → horizon → sky`

## Expected baseline result

When this sandbox is working as expected, you should see:

- soft blue sky at the top of the viewport
- a white/light horizon band
- terrain fading smoothly into fog
- clear and dramatic difference between **Flat** and **Horizon** presets
- clear side-by-side feel differences between **Hzn 36.87**, **Hzn 45**, and **Hzn 50** controls

## Known issues / verification notes

- If horizon/sky is **not** visible with the Horizon preset and `Sky enabled` checked, capture that as an environment-specific issue first (WebGL/GPU/browser/runtime), since this sandbox bypasses `oc-map` integration.
- No additional camera constraints are applied beyond the current baseline (`maxPitch: 85`).

## Next step after verification

After this visual foundation is confirmed, use it as the baseline for:

- timeline layer
- card emergence
- story navigation
