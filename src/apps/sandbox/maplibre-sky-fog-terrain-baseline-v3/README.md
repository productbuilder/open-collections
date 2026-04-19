# maplibre-sky-fog-terrain-baseline-v3

Third-iteration sandbox for the MapLibre sky/fog/terrain baseline.

## Relationship to v2

This sandbox builds directly on `maplibre-sky-fog-terrain-baseline-v2` and keeps that baseline intact.

- v2 is preserved unchanged as the stable reference.
- v3 keeps the same map camera/horizon setup, right-side navigation controls, and bottom floating shelf.

## What changed in v3

- Added a new **top floating depth carousel** layer above the map as a first browsing UI experiment.
- Carousel uses a small **mock dataset** (titles/years/types only).
- The center card is visually dominant, while side cards appear slightly farther back using perspective transforms.
- Added simple horizontal interaction (arrow buttons + drag/swipe gesture) to cycle active cards smoothly.

## Current limitations (intentional)

The v3 carousel is currently **prototype-only** and is not connected to:

- map markers
- timeline logic
- item selection synchronization
- story mode or Three.js rendering

## Purpose of this iteration

v3 tests whether a lightweight perspective card strip feels right in this spatial map setup before integrating real browsing/timeline behavior.
