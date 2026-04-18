# time-explorer-v1

Versioned sandbox prototype for a **timeline-first time explorer** that combines map-like context, cards, and story filtering.

## What this prototype explores

This experiment tests whether one interface can smoothly support three attention modes:

1. **Explore**: map/space dominant, timeline-driven filtering, points emphasized near the selected year.
2. **Focus / Card browsing**: one active card emerges above its point, timeline snaps through available items, neighboring cards are hinted.
3. **Story**: selecting a story chip filters the data, highlights narrative context, and can autoplay through story-ordered cards.

The timeline remains the primary control in all states.

## Sandbox-only scope

This app lives in `src/apps/sandbox/time-explorer-v1/` and is intentionally isolated from production collection browser flows.

- No backend calls.
- No map library integration.
- No app-shell wiring.

It is a self-contained static prototype for concept validation only.

## Intentional simplifications

- `latLike` and `lonLike` are pseudo-coordinates, not geographic coordinates.
- Stage depth is faked with CSS transforms, blur, opacity, scale, and layering.
- Image content is represented by lightweight placeholders (`imageLabel`).
- Timeline snapping in non-explore states uses nearest-item logic against the filtered set.
- Story autoplay is a simple timed interval.

## Files

- `index.html` — full single-screen UI shell and styles.
- `data.js` — fake stories + item dataset.
- `app.js` — state, rendering, filtering, timeline behavior, focus/story interactions.
