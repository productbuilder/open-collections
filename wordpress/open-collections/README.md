# Open Collections WordPress Plugin Scaffold

This folder contains the first implementation scaffold for a distributable WordPress plugin.

## Purpose

- WordPress is the integration layer.
- Collection Manager remains the editing and publishing UI.
- Protocol-facing outputs remain standard Open Collections Protocol resources.

This scaffold does not reimplement Collection Manager inside WordPress.

## Structure

- `open-collections.php` plugin bootstrap
- `includes/class-open-collections-plugin.php` wiring and lifecycle
- `includes/class-open-collections-settings.php` admin settings page and option schema
- `includes/class-open-collections-embed.php` shortcode/admin mount and script enqueue
- `includes/class-open-collections-output.php` protocol output rewrite placeholders
- `assets/js/open-collections-embed.js` mount script and config handoff
- `assets/js/collection-manager-placeholder.js` fallback component script

## Implemented now

- Settings page under `Settings -> Open Collections`
- Shortcode: `[open_collections_manager]`
- Optional admin mount page under `Tools -> Open Collections Manager`
- Config handoff pattern:
  - plugin defaults via localized script config (`OpenCollectionsPluginConfig`)
  - per-mount overrides via mount `data-*` attributes / `data-ocp-config` JSON
- Placeholder protocol routes:
  - `/collections/{slug}/collection.json`
  - `/collections/{slug}/items/{item-id}.json`
  - `/collections/{slug}/media/{asset-id}`
  - optional `/.well-known/collections.json` (when enabled)

## Not implemented yet

- persistent manifest/item/media storage pipeline
- full provider integrations
- full media library mapping
- registry/indexer functionality
- full Gutenberg block integration

## Notes

- Set `Collection Manager script URL` in plugin settings to load the real component bundle.
- If no URL is set, a local placeholder script is used so mount behavior can still be tested.
