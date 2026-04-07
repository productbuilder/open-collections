# Open Collections Time Slider v2 (Prototype)

`timeslider-v2` is a standalone, mobile-first interaction prototype for timeline browsing.

## Goal

Explore a next interaction model where:

- the center marker is fixed,
- the timeline/ruler moves beneath the center marker,
- a visible symmetric active range around the center is the filter window,
- and dragging either edge of the active range resizes the window symmetrically.

## Interaction model

State:

- `focusYear`
- `windowSizeYears`

Derived:

- `activeStartYear`
- `activeEndYear`

Primary gestures:

- Drag ruler body: shifts `focusYear`
- Drag active-range edge handle: changes `windowSizeYears` symmetrically around focus year

## Mock domain

This prototype uses a static year domain of `1800..2025`.

## Run locally

1. Serve the repository root with any static server.
2. Open:

- `http://localhost:<port>/src/apps/timeslider-v2/`

On mobile, load the same URL from your device against your dev machine host.
