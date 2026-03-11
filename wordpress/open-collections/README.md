# Open Collections WordPress Plugin Scaffold

This folder contains the current implementation scaffold for a distributable WordPress plugin.

## Purpose

- WordPress is the integration layer.
- Collection Manager remains the editing and publishing UI.
- Protocol-facing outputs remain standard Open Collections Protocol resources.

This scaffold does not reimplement Collection Manager inside WordPress.

## Structure

- `open-collections.php` plugin bootstrap
- `includes/class-open-collections-plugin.php` wiring and lifecycle
- `includes/class-open-collections-settings.php` admin settings page and output settings schema
- `includes/class-open-collections-embed.php` shortcode/admin mount and script enqueue
- `includes/class-open-collections-output.php` protocol output routes and structured stubs
- `assets/js/open-collections-embed.js` mount script and config handoff
- `assets/js/collection-manager-placeholder.js` fallback component script

## Implemented now

- Settings page under `Settings -> Open Collections`
- Shortcode: `[open_collections_manager]`
- Optional admin mount page under `Tools -> Open Collections Manager`
- Config handoff pattern:
  - plugin defaults via localized script config (`OpenCollectionsPluginConfig`)
  - per-mount overrides via mount `data-*` attributes / `data-ocp-config` JSON
- Protocol-facing output model with configurable route shape:
  - collection base path (default `/collections`)
  - manifest filename (default `collection.json`)
  - item route segment (default `items`)
  - media route segment (default `media`)
- Protocol output stubs:
  - `/{collection-root}/{slug}/{manifest-filename}`
  - `/{collection-root}/{slug}/{item-segment}/{item-id}.json`
  - `/{collection-root}/{slug}/{media-segment}/{asset-path}`
- Optional DCD output:
  - `/.well-known/collections.json`, or
  - custom DCD path when configured

## Not implemented yet

- persistent manifest/item/media storage pipeline
- full provider integrations
- full media library mapping
- registry/indexer functionality
- full Gutenberg block integration

## Notes

- Set `Collection Manager script URL` in plugin settings to load the real component bundle.
- If no URL is set, a local placeholder script is used so mount behavior can still be tested.
- Current protocol outputs are structured, realistic stubs to establish stable public URLs while storage/publishing internals are implemented incrementally.
