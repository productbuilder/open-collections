# Open Collections WordPress Plugin Scaffold (Phase 2)

## Location

Plugin scaffold lives at:

- `src/integrations/wordpress/open-collections/`

## What is implemented now

- WordPress plugin bootstrap and modular include structure
- Admin settings page (`Settings -> Open Collections`)
- Shortcode embedding path for Collection Manager:
  - `[open_collections_manager]`
- Optional admin mount page (`Tools -> Open Collections Manager`) controlled by settings
- Script enqueue and config handoff pattern:
  - defaults via localized config object (`OpenCollectionsPluginConfig`)
  - legacy compatibility envelope (`OpenCollectionsConfig`)
  - per-mount overrides via data attributes and `data-ocp-config` JSON
- Protocol output route scaffolding with configurable URL model:
  - collection base path (default `/collections`)
  - manifest filename (default `collection.json`)
  - item route segment (default `items`)
  - media route segment (default `media`)
- Protocol-facing output stubs:
  - `/{collection-root}/{slug}/{manifest-filename}`
  - `/{collection-root}/{slug}/{item-segment}/{item-id}.json`
  - `/{collection-root}/{slug}/{media-segment}/{asset-path}`
- Optional DCD output:
  - `/.well-known/collections.json` (default)
  - custom configured path (optional)
- Legacy REST compatibility output stubs:
  - `/wp-json/open-collections/v1/collection.json`
  - `/wp-json/open-collections/v1/items/{itemId}`
  - `/wp-json/open-collections/v1/media/{path}`

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

The plugin does not reimplement Collection Manager. It mounts the existing custom element (`open-collections-manager`) and passes environment/configuration values. This preserves portability across WordPress and non-WordPress deployments.
