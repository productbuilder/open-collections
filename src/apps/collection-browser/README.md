# Browser App

Open Collections Browser is the read-only collection browsing app.

## Scope

- Load collection manifests
- Browse item cards
- View media in a larger viewer
- View metadata in read-only mode

## Entry

- Source app host page: `/src/apps/collection-browser/`
- Source web component script: `/src/apps/collection-browser/src/index.js`
- Published app host page: `/src/apps/collection-browser/`
- Published web component script: `/src/apps/collection-browser/src/index.js`

## Notes

- Built with vanilla JS + Web Components.
- Uses shared helpers from `/src/shared/library-core/`.

## Shell Adapter Mode

- In embedded shell usage, `collection-browser` can run in `data-shell-list-adapter="true"` mode.
- In this mode, list data is projected by the shell from canonical runtime store data and delivered through:
  - `browse-shell-list-projection`
  - `browse-shell-runtime-state`
- In shell adapter mode, the list surface does not perform embedded ingestion.
- Standalone direct manifest loading remains intentionally retained for non-shell usage.

## Architecture Note

- The shell-owned canonical browser path is now the default architecture.
- `collection-browser` remains a standalone app entry, so direct manifest loading is intentionally retained only for non-shell use.
- The next recommended step is to replace the legacy child-app shell bridge with a shell-native list surface so compatibility events can be removed.
