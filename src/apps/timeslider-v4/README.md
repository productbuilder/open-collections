# Open Collections Time Slider v4 (Prototype)

`timeslider-v4` is a standalone, mobile-first refinement of `timeslider-v3`.

## Goal

Keep the v3 interaction model while moving the structure and hierarchy closer to the latest sketch:

- one calm centered focus-year pill,
- a cleaner two-track layout (upper ruler + lower resize lane),
- a clearly bounded active range box,
- edge labels for active min/max years,
- compact lower handles with grip cues,
- centered compact range-width label (for example `24y`),
- neutral greyscale visual pass.

## Interaction model

State:

- `domain: { minYear, maxYear }`
- `focusYear`
- `activeRangeYears`
- `pixelsPerYear` (fixed scale for clarity)

Derived:

- `activeStartYear`
- `activeEndYear`

Primary gestures:

- Drag upper ruler band: shifts `focusYear`
- Drag lower lane handles: changes `activeRangeYears` symmetrically

## Run locally

1. Serve the repository root with any static server.
2. Open:

- `http://localhost:<port>/src/apps/timeslider-v4/`

For side-by-side comparison, keep these routes available:

- `/src/apps/timeslider-v1/`
- `/src/apps/timeslider-v2/`
- `/src/apps/timeslider-v3/`
- `/src/apps/timeslider-v4/`
