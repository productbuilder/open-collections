# maplibre-sky-fog-terrain-baseline-v1

Baseline verification sandbox for the official MapLibre **Sky, Fog, Terrain** example:

- Official example: https://maplibre.org/maplibre-gl-js/docs/examples/sky-fog-terrain/

## Purpose

This sandbox is intentionally isolated and uses **raw `maplibregl.Map(...)`** directly.

It exists to answer:

> Can we make the horizon appear at all in our environment if we literally copy the official working example?

## Intentional constraints

This sandbox deliberately does **not** use:

- `oc-map`
- `oc-map-three-layer`
- shared map abstractions
- timeline/cards/story UI

## What is included

- MapLibre CSS and JS from CDN
- Inline style object closely matching the official example
  - OSM raster base source
  - terrain raster-dem source
  - separate hillshade raster-dem source
  - terrain enabled in style
  - hillshade layer enabled
- `map.setSky(...)` with official baseline values
- Minimal preset controls:
  - Flat
  - Browse
  - Spatial
  - Horizon
- `Sky enabled` checkbox

## Expected baseline result

When this sandbox is working as expected, you should see:

- blue sky at the top of the viewport
- terrain fading into fog
- visible horizon at high pitch
- clear difference between **Flat** and **Horizon** presets

## Known issues / verification notes

- If horizon/sky is **not** visible with the Horizon preset and `Sky enabled` checked, capture that as an environment-specific issue first (WebGL/GPU/browser/runtime), since this sandbox bypasses `oc-map` integration.
- No additional camera constraints are applied beyond the official-style setup (`maxPitch: 85`).

## Next step after verification

After this baseline is confirmed visually, port the same terrain/sky/fog setup into `oc-map`-based sandboxes and debug integration differences there.
