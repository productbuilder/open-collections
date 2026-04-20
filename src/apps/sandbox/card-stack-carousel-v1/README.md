# card-stack-carousel-v1

A standalone sandbox prototype focused on a **vertical stacked card carousel** interaction.

## Purpose

This sandbox isolates the card-stack concept so motion and composition can be evaluated without map, timeline, or other app chrome dependencies.

## Interaction model

- The **top card** is the focused, fully readable card.
- Remaining cards sit below it as a layered stack with depth cues.
- Drag/swipe **up** moves the active card upward and promotes the next card into focus.
- Drag/swipe **down** reveals and restores the previous card.
- Motion is live during gesture and snaps on release based on threshold.

## Prototype characteristics

- Standalone implementation in plain web platform APIs.
- Touch-first interaction (pointer events + `touch-action: none` on the gesture surface).
- Mock dataset of 10 rich cards (title, category, description, and visual header treatment).
- Layering via CSS transforms (`translateY`, `scale`), z-index, shadow, and opacity.

## Files

- `index.html` — minimal page shell for the isolated sandbox.
- `app.js` — stack component, mock data, and gesture/snap behavior.
- `README.md` — experiment context and intended evaluation goals.
