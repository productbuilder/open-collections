# Open Collections Time Slider v1 (Prototype)

`timeslider-v1` is a standalone, mobile-first interaction prototype for timeline browsing.

## Goal

Validate a centered timeline model where:

- the center marker is fixed,
- the timeline moves underneath,
- and users can adjust the active time window width.

## Interaction model

State:

- `centerYear`
- `windowSizeYears` (`1 | 10 | 20 | 50 | 100 | "all"`)

Derived:

- `startYear`
- `endYear`

User can drag the ruler horizontally. Dragging updates `centerYear` while the center marker stays fixed.

## Mock domain

This prototype uses a static year domain of `1800..2025`.

## Run locally

1. Serve the repository root with any static server.
2. Open:

- `http://localhost:<port>/src/apps/timeslider-v1/`

On mobile, load the same URL from your device against your dev machine host.
