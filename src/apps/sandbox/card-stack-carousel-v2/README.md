# card-stack-carousel-v2

A standalone sandbox for a **physics-based vertical card carousel**.

## What this prototype is

This version is a clean, minimal base for stack-carousel motion. It uses a continuous position model (`position` + `velocity`) so movement remains fluid during drag and momentum.

## Motion model

- `position` is a float representing the current scroll location.
- `velocity` carries momentum after pointer release.
- A continuous `requestAnimationFrame` loop updates motion every frame.
- There is no index snapping yet.

## Rendering model

- Card order in the DOM never changes.
- The card list is built once and never re-rendered.
- Every frame only updates transform/opacity/z-index for each card.

This provides a stable foundation for future advanced stack behavior in v2.
