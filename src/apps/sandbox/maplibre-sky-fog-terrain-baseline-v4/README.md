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
- Refined the vertical depth queue motion so:
  - the active card sits higher in a top focal zone near the horizon line,
  - swipe-up / swipe-down touch gestures now provide live drag feedback while moving,
  - release snaps the stack back into the same stable top-centered focal resting position,
  - trailing cards are vertically compressed into shallower receding slices,
  - depth fade/disappearance is pushed farther upward toward the horizon region.

### Motion/composition refinement update

- Moved the main resting card slightly higher so the focal card sits closer to the horizon zone.
- Fixed card width clipping by widening the carousel layout envelope and allowing full-width card rendering.
- Updated drag behavior to preserve true vertical direction:
  - drag up moves cards upward,
  - drag down moves cards downward,
  - release outcomes now follow both drag direction and threshold.


### Interaction boundary + card surface refinement update

- Restricted carousel hit-testing to the top card zone so the map stays draggable/zoomable outside that area.
- Restored map pan/pinch interaction below and around the top card interaction zone.
- Changed the outgoing top card to be drag-only: it now appears only while swiping and disappears at rest.
- Switched card bodies to opaque surfaces (main + trailing cards) and kept depth cues via scale/blur/position/contrast/shadow.

### Layout cleanup pass

- Controls now start closed on initial load so the first impression prioritizes map/horizon + cards.
- Controls access was moved down above the timeline shelf so it lives in the lower control zone.
- Next/previous card controls were also moved out of the top card area and placed with the lower control zone.
- This pass is intended to isolate and evaluate top card composition more clearly before behavior refinement.

### Card sizing + drag-state visibility refinement update

- The card stack interaction container now spans full screen width to allow wider centered motion space.
- Individual cards remain inset and narrower (roughly 80–90% viewport width) so they do not touch screen edges.
- The oversized top card is now a drag-only transient state and is removed when drag interaction settles.

### Temporary top-card visibility lifecycle update

- The oversized top card is hidden in the resting/static state so the main focal card stays fully readable.
- On drag start, the oversized top card now fades in and follows the existing depth-motion path.
- After release/snap settle, the oversized top card fades back out and the resting composition returns cleanly.

### Interaction zone debug visibility update

- Added a temporary red outline around the top carousel interaction container so gesture bounds are explicitly visible during debugging.
- Constrained swipe/drag gesture capture to that outlined top container only; map interactions below it should pass through normally.
- This pass is focused on validating interaction boundaries and hit-testing isolation, not final visual styling.

### Reduced top interaction-zone height update

- Reduced the top carousel interaction-zone height while keeping it full-width and attached to the top edge.
- The red debug-outlined zone now better matches the visible top card stack instead of extending deep into mid-screen map space.
- This was done to prevent carousel hit-testing from interfering with map interaction below the card stack region.

### Internal stack placement refinement update

- Kept the same top full-width interaction container bounds and retained the red debug outline.
- Moved the card stack's internal resting placement lower within that existing top gesture zone for improved vertical balance.
- This pass only refines card composition inside the established interaction area; gesture boundaries and behavior remain unchanged.

## Intent

v4 is designed to preserve horizon visibility and strengthen the feeling of browsing through time/depth in the scene, instead of blocking the horizon with a wide overlay.

## Current limitations (intentional)

This is still **mock-data only** and is not synchronized with:

- map markers
- timeline behavior
- item selection state
- story mode / Three.js rendering
