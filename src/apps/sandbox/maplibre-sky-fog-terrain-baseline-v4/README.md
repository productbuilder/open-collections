# maplibre-sky-fog-terrain-baseline-v4

Fourth-iteration sandbox for the MapLibre sky/fog/terrain baseline.

## Relationship to v3

This sandbox is a variation of `maplibre-sky-fog-terrain-baseline-v3` and leaves v3 untouched.

- v3 remains the baseline reference with the flat top carousel strip.
- v4 keeps the same map/horizon composition, right-side map navigation controls, top Controls toggle, and bottom floating shelf.

## What changed in v4

- Replaced the v3 **flat top carousel slab** with a **vertical depth carousel** experiment.
- Cards now stack along a vertical depth path:
  - the active card now sits higher near the horizon focal zone,
  - non-active cards trail downward underneath it with reduced scale/opacity/clarity,
  - lower cards fade into map depth so moments feel like they emerge into focus and then recede.
- Added simple vertical browsing interaction with:
  - up/down buttons,
  - vertical swipe/drag on the card stack.

## Intent

v4 is designed to preserve horizon visibility and strengthen the feeling of browsing through time/depth in the scene, instead of blocking the horizon with a wide overlay.

## Current limitations (intentional)

This is still **mock-data only** and is not synchronized with:

- map markers
- timeline behavior
- item selection state
- story mode / Three.js rendering
