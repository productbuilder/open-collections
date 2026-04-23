# card-stack-carousel-v4-2

This sandbox is a refinement pass on `card-stack-carousel-v4`, keeping the same GSAP + ScrollTrigger architecture and staged timeline behavior.

## Refinements in v4-2

- Motion was tuned to read more clearly as **upward** travel through the stack.
- Card proportions were shifted toward a **2:1** feel (wider and shorter).
- Transform staging was adjusted so cards emerge more from **underneath** the stack than from deep behind it.

## Preserved behavior

- Light grey background and overall visual identity.
- Blur/fade staging and card lifecycle.
- Pinned carousel, intro fade/progress ramp, and arrow behavior.
- Scroll-driven GSAP timeline with ScrollTrigger scrubbing.
