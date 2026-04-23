# card-stack-carousel-v3

A standalone sandbox that recreates a **GSAP-style scrolling 3D card stack** with a timeline model.

## Key idea

This is **not** a traditional carousel with index snapping or fixed-position slides.

The full animation is driven by a single continuous timeline value:

- `progress` ranges from `0` to `1`
- wheel/drag input updates timeline progress
- each card computes a local phase using:
  - `cardProgress = progress * totalCards - index`

## Motion phases

Every card moves through four phases:

1. **Idle (below):** appears below the stack with slight depth.
2. **Active:** card reaches center emphasis at full scale.
3. **Stacking:** card shifts upward, compresses, and tilts in 3D.
4. **Exit:** card fades and continues upward out of view.

## Rendering model

- Cards are all absolutely positioned at the same origin.
- DOM order stays fixed.
- Each frame updates only visual properties (`transform`, `opacity`, `z-index`).

Inspired by GSAP ScrollTrigger stack demos, but implemented manually with native Web Components + requestAnimationFrame.
