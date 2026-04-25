# 3DBAG alignment sandbox (v1)

Framework-free sandbox that composes shared `<oc-map>` with `<oc-3dbag-alignment-layer>`.

## Purpose

- Reuse the same public 3DBAG data flow as the official viewer where practical.
- Current implemented strategy: OGC/REST fallback via `https://api.3dbag.nl/collections/pand/items`.
- Keep code modular and dependency-free so rendering/data strategy can be swapped later.

## Included modules

- `src/shared/data/3dbag/bag-viewer-url.js`
  - Parse/create viewer links with `rdx/rdy/ox/oy/oz` camera parameters.
- `src/shared/data/3dbag/bag-3d-client.js`
  - Single source of truth for 3DBAG endpoints and request construction.
- `src/shared/data/3dbag/bag-3d-normalize.js`
  - Normalize API payloads and BAG `pand` identifiers.
- `src/shared/data/3dbag/bag-3d-projection.js`
  - Minimal, documented RD→WGS84 helper for sandbox alignment.
- `src/apps/sandbox/3dbag-alignment-v1/oc-3dbag-alignment-layer.js`
  - Web Component lifecycle + map wiring + status/selection events.

## Event contract

`oc-3dbag-alignment-layer` emits:

- `oc-3dbag-layer-status`
  - `{ strategy, bbox, featureCount, bagViewerUrl }`
- `oc-3dbag-building-activate`
  - `{ bagPandId, attributes, source: "3dbag" }`

## How to run

1. `pnpm site:preview`
2. Open:
   `http://localhost:4321/src/apps/sandbox/3dbag-alignment-v1/index.html`

## Notes

- This spike does **not** copy viewer implementation code.
- Public 3D tiles endpoint pattern is documented in `bag-3d-client.js`, but this sandbox currently uses the OGC `pand/items` path for alignment + selection.
- Rendering is intentionally isolated behind the layer component so this debug map style can be replaced with viewer-like tile/mesh rendering later.
