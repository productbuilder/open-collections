# Open Collections Timemap Browser App (Scaffold)

`timemap-browser` is the first app-level scaffold for a future timemap browsing experience.

## Scope (this phase)

- app bootstrapping + registration as a web-component app
- layout composition for filters, map, timeline, and detail/cards placeholders
- shared `oc-map` primitive mounted with a practical development default view (Hilversum)

## Not included yet

- production data loading and map layers
- full filter behavior
- full timeline interactions
- full cards/detail logic

## Run locally

From repository root:

1. `pnpm site:preview`
2. Open `http://localhost:4321/src/apps/timemap-browser/`

## Manual verification

- The app should render a titled scaffold page.
- The filter, timeline, and detail/cards areas should show placeholder content.
- The map area should render a working `oc-map` centered around Hilversum.
