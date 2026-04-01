# Open Collections Presenter App

Open Collections Presenter is the dedicated **Present** app mounted inside `app-shell`.

## MVP status (grid-based Present surface + create/edit flow)

The first MVP now provides a dedicated presentation area with:

- a Present page header
- a panel toolbar with an **Add app** action
- a responsive grid of saved presentation items
- richer `time-comparer` card metadata (title, type badge, descriptive summary, actionable card controls)
- dialog/viewer opening behavior for selected presentation items
- a template picker and guided create flow for `time-comparer`
- guided edit flow for existing `time-comparer` items (reuses the same step UI as create)

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

## Add app action (current MVP)

`Add app` now opens a minimal but functional creation workflow:

1. **Template picker** (currently one option: **Time comparer**)
2. **Step 1:** pick a `past` image item
3. **Step 2:** pick a `present` image item
4. **Step 3:** configure labels (`pastLabel`, `presentLabel`) and initial split
5. **Step 4:** review and save

Saving creates a new in-memory presentation item in the loaded presentations model and refreshes the Present grid immediately.

## Edit app action (MVP scaffold)

`time-comparer` cards now include an **Edit** action. The edit path uses the same four-step wizard UI as create:

1. preload current compare selections and settings
2. adjust past/present source images
3. update labels + split + show-labels setting
4. review and save changes

Saving in edit mode updates the existing in-memory presentation item and refreshes the grid.

### Validation included in MVP

- requires selecting both image items
- prevents identical `past` and `present` refs
- shows clear inline error text before allowing save

### Current limitations

- template picker only supports `time-comparer`
- created items are saved to the app's current in-memory collection model (not persisted back to disk in this MVP)
- edited items are saved to the same in-memory collection model (no disk persistence in this MVP)

## Next recommended step

Add persistence for created/edited presentation items (for example OPFS/local draft save path aligned with manager/browser flows), then extend richer preview composition (for example explicit split-preview thumbnails).

## Entry

- Source app host page: `/src/apps/collection-presenter/`
- Source web component script: `/src/apps/collection-presenter/src/index.js`
