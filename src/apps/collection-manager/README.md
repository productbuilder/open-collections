# Open Collections Manager App

Open Collections Manager is the writable collection-management app.

## Scope

- Connect storage sources
- Select and manage collections per source (scaffolded where provider discovery is limited)
- Edit item metadata
- Publish/export `collection.json`
- Keep registration in-flow via placeholder UI

## Entry

- Source app host page: `/src/apps/collection-manager/`
- Source web component script: `/src/apps/collection-manager/src/index.js`
- Published app host page: `/src/apps/collection-manager/`
- Published web component script: `/src/apps/collection-manager/src/index.js`

## Current storage sources

- GitHub repository (primary writable flow)
- Google Drive connected source (read-only import mode currently)
- Planned: S3-compatible storage, WordPress/CMS, and other providers

## Notes

- Built with vanilla JS + Web Components.
- Browser-local source-memory keeps non-secret config only.
- Registration is currently a placeholder dialog.
- OPFS is used for local draft/workspace persistence when available.
- Draft workflow is explicit: `Save locally`, `Restore draft`, `Discard draft`.
- New collections can be created from scratch via `New collection` and start as local drafts.
- Each collection uses its own root directory namespace (for example `harbor-collection/collection.json`, `harbor-collection/media/*`, `harbor-collection/thumbs/*`).
- Open Collections Manager publishes one selected source + one selected collection at a time.
- Image ingestion supports drag-and-drop and file picker (`jpg`, `jpeg`, `png`, `webp`, `gif`).
- Mobile/Capacitor flow uses explicit pickers for image/document input; drag-and-drop remains desktop-only by design.
- Unsupported mobile behavior (for example local directory handles) fails with explicit platform errors instead of silent fallback.
- New images are added immediately as local draft items with upload status badges.
- Thumbnails are generated automatically for image assets when possible.
- GitHub publish uploads `media/*`, `thumbs/*.thumb.jpg`, and updates `collection.json`.
- Publishing remains separate from OPFS and uses storage providers.
- Secrets (PATs, OAuth tokens, passwords) are never persisted in OPFS.

## Component header/action visibility

`open-collections-manager` now keeps auxiliary header actions hidden by default so embedded usage stays content-focused.

- `show-header` – enables the optional manager-local header/action bar.
- `show-connections-action` – shows the manage-account/manage-connections action in that local header (requires `show-header`).
- `show-manage-account-action` – alias for `show-connections-action` (takes precedence when both are set).
- `show-more-action` – shows the more/workflow menu header action (requires `show-header`).

All attributes/properties are optional booleans. Defaults are `false`, so embedded usage keeps the main manager view focused on workflow content with no auxiliary header actions.

Example standalone usage with both actions visible:

```html
<open-collections-manager show-header show-connections-action show-more-action></open-collections-manager>
```
