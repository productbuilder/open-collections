# card-stack-carousel-v4

This sandbox is a direct recreation of the GSAP ScrollTrigger **Scrolling 3D Card Carousel** demo behavior from FreeFrontend/CodePen.

## What it is

- A **scroll-driven GSAP timeline** (GSAP + ScrollTrigger) where page scroll controls animation progress.
- A staged 3D card stack sequence with depth, staggered movement, blur transitions, and fade-out.
- An intro phase that animates `tl.progress` from `1` to `0.07`, then enables scrolling and pins the carousel while scrolling through `main`.
- An animated arrow indicator that loops before scroll interaction and fades as scroll begins.

## What it is not

- Not a traditional carousel with drag/swipe interaction.
- Not a physics/position/velocity implementation.

## Isolation intent

`card-stack-carousel-v4` is intentionally isolated from the `v1`, `v2`, and `v3` sandbox experiments so this version can remain a faithful, source-aligned recreation.
