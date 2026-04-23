# card-stack-carousel-v5

This sandbox recreates the `card-stack-carousel-v4` effect family using **pure vanilla JavaScript** (no GSAP, no ScrollTrigger, no third-party animation libraries).

## What v5 tests

- A dependency-free version of the same scroll-driven 3D-like card-stack behavior.
- Manual pinning/stage behavior using native CSS sticky layout (`.pin-wrap` stays on screen while `main` provides scroll range).
- A normalized animation progress value (`progress` in `0..1`) computed directly from document scroll.
- Staggered card transforms derived from global progress + per-card index offsets.

## How it works

- `main` provides a long page (`700vh`) so native scroll supplies animation time.
- The carousel section is pinned with `position: sticky; top: 0; height: 100vh;`.
- `window.scrollY` is mapped to normalized progress:
  - `progress = clamp(scrollY / (main.scrollHeight - innerHeight), 0, 1)`.
- Each card computes a local phase from:
  - global progress
  - stagger offset by index
- Card styles are updated in JS each frame (on scroll via `requestAnimationFrame`):
  - depth (`translate3d(..., z)`)
  - `rotateX`
  - upward shift
  - blur changes
  - opacity fade + hide near completion
- Arrow behavior is also dependency-free:
  - CSS keyframe pulse loop at start
  - JS-controlled fade-out once scrolling begins

## Why this exists

`v5` exists to verify the same visual behavior class as `v4` can live without GSAP/ScrollTrigger while keeping similar stacking, stagger, upward disappearance, and pinned-scroll feel.
