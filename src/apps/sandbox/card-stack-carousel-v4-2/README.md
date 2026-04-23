# card-stack-carousel-v4-2

This sandbox is a refinement pass on `card-stack-carousel-v4`, keeping the same GSAP + ScrollTrigger architecture and staged timeline behavior.

## Refinements in v4-2

- Motion now uses a **true upward-moving stack** with fixed slots.
- The active card is the **top slot of the stack**, not a separate floating layer.
- During each transition, **all visible cards advance upward together** by one slot.
- Card proportions remain tuned toward a **2:1** feel (wider and shorter).
- The top card exits through the top edge while a new card enters from the bottom slot.

## Lane note

- v4-2 uses a single continuous upward stack lane.
- Slot 0 is the active top card; queued cards remain underneath in lower slots.
- On every scroll transition, the entire stack shifts upward one slot.

## Preserved behavior

- Light grey background and overall visual identity.
- Blur staging and card lifecycle.
- Pinned carousel, intro fade/progress ramp, and arrow behavior.
- Scroll-driven GSAP timeline with ScrollTrigger scrubbing.

## Visual correction note

- Cards now render in their assigned final colors from the first frame.
- Semi-transparency during card motion has been removed so cards remain fully opaque while stacking.
