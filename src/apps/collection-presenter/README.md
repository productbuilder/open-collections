# Open Collections Presenter App

Open Collections Presenter is the dedicated **Present** app mounted inside `app-shell`.

## MVP status (grid-based Present surface)

The first MVP now provides a dedicated presentation area with:

- a Present page header
- a panel toolbar with an **Add app** action
- a responsive grid of saved presentation items
- dialog/viewer opening behavior for selected presentation items

## Current data source

Present currently loads a dedicated local sample collection:

- `/src/collections/presentations/collection.json`

This collection includes one example `time-comparer` presentation item and its linked image items.

## Presentation item model in MVP

The MVP follows the existing repository shape already used by `time-comparer` integration:

- `type: "presentation"`
- `presentationType: "time-comparer"`
- `compare` for linked source items (`pastItemId`, `presentItemId`)
- `settings` for template options (`initialSplit`, labels, etc.)

## Viewer behavior

Clicking a presentation card opens the existing viewer dialog pattern (`open-browser-viewer-dialog`).

For `presentationType: "time-comparer"`, the viewer renders `oc-time-comparer-item` and passes collection items for compare-target resolution.

## Add app action (MVP)

`Add app` is intentionally scaffolded in this MVP and currently updates status text with a placeholder next-step message.

## Next recommended step

Implement a minimal template picker + guided create flow that creates new draft presentation items and refreshes the Present grid.

## Entry

- Source app host page: `/src/apps/collection-presenter/`
- Source web component script: `/src/apps/collection-presenter/src/index.js`
