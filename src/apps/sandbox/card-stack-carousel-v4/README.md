# card-stack-carousel-v4

A standalone recreation of the **Scrolling 3D Card Carousel** demo behavior.

## Behavior contract

- This is a **GSAP + ScrollTrigger scroll-scrubbed animation**.
- Scroll position drives the timeline progress from start to end.
- Cards use staged 3D transforms, staggering, blur, radial masks, and fade-out timing to preserve the original stacked-depth motion.
- This is **not** a draggable physics carousel and intentionally does not use custom position/velocity math.

## Files

- `index.html` — sandbox shell and card stack markup.
- `style.css` — full-viewport 3D stage styling.
- `app.js` — GSAP timeline + ScrollTrigger scrubbing logic.
