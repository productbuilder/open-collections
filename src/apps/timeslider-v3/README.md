# Open Collections Time Slider v3 (Prototype)

`timeslider-v3` is a standalone, mobile-first interaction prototype for timeline browsing.

## Goal

Validate a clearer interaction model than v2:

- center focus year remains fixed to a center marker,
- ruler drag moves through time only,
- active range remains symmetric around the focus year,
- resize handles are spatially separated from the ruler drag zone,
- and the current active range is shown directly in the control.

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

- Drag ruler band: shifts `focusYear`
- Drag detached top handles: changes `activeRangeYears` symmetrically

## Internal domain model

The prototype defaults to `1800..2025` but is structured with a parameterized `domain` object so alternate domains can be tested with minimal changes (for example `-10000..2025`, `-5000..2025`, or `1800..2025`).

## Run locally

1. Serve the repository root with any static server.
2. Open:

- `http://localhost:<port>/src/apps/timeslider-v3/`

On mobile, load the same URL from your device against your dev machine host.
