# card-stack-carousel-v1

A standalone sandbox prototype focused on a **vertical stacked card carousel** interaction.

## Purpose

This sandbox isolates the card-stack concept so motion and composition can be evaluated without map, timeline, or other app chrome dependencies.

## Interaction model

- The **top card** is the focused, fully readable card.
- Remaining cards sit below it as a layered stack with depth cues.
- Drag/swipe **up** moves the active card upward and promotes the next card into focus.
- Drag/swipe **down** reveals and restores the previous card.
- Motion now uses a continuous position model: live drag, momentum after release, gradual velocity decay, then clean snap to the nearest resting card.
- Motion now uses an asymmetric model: bottom cards continue flowing upward in a readable queue, while cards above the active card compress into a stacked-collapse zone and then disappear upward (inspired by timeline/stacked-card motion references).

## Prototype characteristics

- Standalone implementation in plain web platform APIs.
- Touch-first interaction (pointer events + `touch-action: none` on the gesture surface).
- Mock dataset of 10 rich cards (title, category, description, and visual header treatment).
- Layering via CSS transforms (`translateY`, `scale`), z-index, shadow, and opacity.
- Updated light palette with a light grey background and white cards with dark outlines.

## Files

- `index.html` — minimal page shell for the isolated sandbox.
- `app.js` — stack component, mock data, and gesture/snap behavior.
- `README.md` — experiment context and intended evaluation goals.

## Recent refinement notes

- Viewport fit was corrected so lower controls remain visible on small mobile screens using viewport-aware sizing and safe-area bottom spacing.
- Motion was refactored around one continuous stack position with explicit drag → momentum → snap phases.
- Flashing/flicker was reduced by reusing card DOM nodes and separating live transform updates from post-release settle behavior.
