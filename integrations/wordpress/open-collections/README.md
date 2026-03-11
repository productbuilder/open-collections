# Open Collections for WordPress (MVP Integration Pass)

This plugin folder now provides a **first usable MVP path** for WordPress integration.

## Positioning

This plugin is an integration/adoption layer, not the protocol itself.

- **Open Collections Protocol** remains the public web contract.
- **Collection Manager** remains the core collection editing/publishing UX.
- **WordPress** provides configuration, permissions, routing, and placement surfaces.

## Current MVP scope

Included in this pass:

- plugin bootstrap file (`open-collections.php`)
- service classes for settings/admin/embed scaffolding
- admin settings page with persisted options
- admin mount page for Collection Manager
- shortcode mount path: `[open_collections_manager]`
- shared JS config envelope passed via `OpenCollectionsConfig`
- manager bundle loading path (`manager_bundle_url`)
- protocol output stubs via REST routes and optional `/.well-known/collections.json`

### Settings included

- Collection root / output path
- Output base URL
- DCD enabled/disabled
- Manager bundle URL + mount mode
- Provider/storage placeholders
- Optional protocol site domain

Not implemented yet:

- full registry backend
- full indexer backend
- advanced provider integrations
- full production publishing/media sync workflows

## Config passing direction

Config is passed through a localized JS object (`OpenCollectionsConfig`) assembled by `Open_Collections_Settings::build_manager_config()`.

Why this direction:

- keeps WordPress as environment/config source
- allows one stable JSON envelope to power admin mount + shortcode mount
- keeps Collection Manager runtime logic portable and reusable outside WordPress

This keeps one stable contract for both admin + shortcode mounts while still allowing future REST bootstrap expansion.

## Embed quick start

1. Activate plugin in WordPress.
2. Open **Open Collections** settings and save values.
3. Set **Manager bundle URL** to a built Collection Manager bundle exposing `window.CollectionManager.mount(root, config)`.
4. Use one mount path:
   - admin page: **Open Collections → Collection Manager**
   - shortcode: add `[open_collections_manager]` to a page/post

If no bundle is configured, the mount area prints config JSON so developers can verify config transport.

## Protocol-facing outputs (target model)

This MVP points toward support for standard outputs:

- `collection.json` (REST stub)
- item detail URLs (REST stub)
- media URLs (REST stub)
- optional `/.well-known/collections.json` (DCD placeholder)
- optional registry export later

Public consumers should rely on protocol outputs rather than WordPress internal storage schemas.
