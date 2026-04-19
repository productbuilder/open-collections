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
  - Reset view (Hilversum default)
  - Browse
  - Spatial
  - Horizon
  - Mountain test (contrast/reference preset)
- Pitch testing controls:
  - slider (`0` to `85`) with live pitch readout
  - preset buttons stay in sync with slider
- Vertical FOV testing controls:
  - slider (`30` to `70`) with live FOV readout
  - FOV preset buttons (**Default 36.87**, **Wide 45**, **Wider 55**, **Extra Wide 70**)
  - horizon comparison buttons (**Hzn 45**, **Hzn 50**, **Hzn 55**, **Hzn 60**, **Hzn 70**)
- `Sky enabled` checkbox

## FOV testing note

Field of view (FOV) controls how much vertical scene area the camera captures.

- MapLibre default vertical FOV is `36.87`.
- This sandbox intentionally tests wider values up to `70` to evaluate whether horizon perception improves in a flatter local context.

## Pitch testing note

- MapLibre documents `setPitch()` in the `0` to `60` range.
- MapLibre also supports `setMaxPitch()` above `60` as experimental.
- This sandbox explicitly sets `map.setMaxPitch(85)` and tests higher pitch values intentionally for horizon perception tuning.

## Local default reference point

- The default start/reset location is now **Hilversum** (`lng 5.1766`, `lat 52.2292`) as the local Dutch baseline.
- A **Mountain test** preset is kept as a stronger terrain contrast/reference case.

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
- clear side-by-side feel differences across **Hzn 45** through **Hzn 70** controls

## Known issues / verification notes

- If horizon/sky is **not** visible with the Horizon preset and `Sky enabled` checked, capture that as an environment-specific issue first (WebGL/GPU/browser/runtime), since this sandbox bypasses `oc-map` integration.
- Higher pitch behavior (`>60`) should be treated as experimental sandbox behavior.
- Wider FOV behavior is intentionally stressed in this sandbox and may look exaggerated compared with production camera defaults.

## Next step after verification

After this visual foundation is confirmed, use it as the baseline for:

- timeline layer
- card emergence
- story navigation
