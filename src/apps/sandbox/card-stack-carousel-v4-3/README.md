# card-stack-carousel-v4-3

This sandbox rebuilds the motion into a true **slot-based stack engine**.

## What changed

- Cards are assigned to stack slots and move by slot position, not by staggered one-off tweens.
- The whole stack advances upward continuously as scroll progress increases.
- The top slot exits above the viewport while downstream cards inherit the next slot.
- Looping is achieved by wrapping each card back to the bottom slot in slot-space.
- No opacity fades, blur staging, or color transitions are used for the stack motion.

## Engine model

- `slotPosition = normalize(index - shift)` drives placement.
- Slot spacing is constant: `STACK_OFFSET`.
- Scale is derived from slot depth: `1 - slotPosition * SCALE_STEP`.
- Every render pass computes full stack layout from state (`shift`), giving deterministic behavior.
