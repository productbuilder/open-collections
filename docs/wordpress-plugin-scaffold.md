# Open Collections WordPress Plugin Scaffold (Phase 1)

## Location

Plugin scaffold lives at:

- `wordpress/open-collections/`

## What is implemented now

- WordPress plugin bootstrap and modular include structure
- Admin settings page (`Settings -> Open Collections`)
- Shortcode embedding path for Collection Manager:
  - `[open_collections_manager]`
- Optional admin mount page (`Tools -> Open Collections Manager`) controlled by settings
- Script enqueue and config handoff pattern:
  - defaults via localized config object (`OpenCollectionsPluginConfig`)
  - per-mount overrides via data attributes and `data-ocp-config` JSON
- Protocol output route placeholders:
  - `/collections/{slug}/collection.json`
  - `/collections/{slug}/items/{item-id}.json`
  - `/collections/{slug}/media/{asset-id}`
  - optional `/.well-known/collections.json` when DCD is enabled

## Architecture boundary

- WordPress is the integration layer (settings, routing, embedding context).
- Collection Manager remains the editing/publishing UI component.
- Public protocol contract is URL-based protocol outputs, not WordPress internals.

## What remains for later phases

- persistent manifest/item/media storage and publishing pipeline
- real provider integrations (beyond placeholders)
- media library mapping and lifecycle handling
- block editor implementation
- registry/indexer integrations

## Collection Manager usage in plugin

The plugin does not reimplement Collection Manager. It mounts the existing custom element (`timemap-collector`) and passes environment/configuration values. This preserves portability across WordPress and non-WordPress deployments.
