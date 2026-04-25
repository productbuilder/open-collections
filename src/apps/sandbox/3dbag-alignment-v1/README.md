# 3DBAG alignment sandbox (v1)

Framework-free sandbox that composes shared `<oc-map>` with a modular `<oc-3dbag-layer>`.

## Goal

- Keep the first integration intentionally small and reviewable.
- Reuse existing map primitive (`oc-map`) and existing 3DBAG helper modules.
- Match publicly documented 3DBAG viewer/API contracts first, without copying bundled viewer code.

## Investigation snapshot (public sources)

- Public data host pattern for 3D Tiles:
  - `https://data.3dbag.nl/<version>/cesium3dtiles/<lod>/tileset.json`
- API endpoint used for selectable building records:
  - `https://api.3dbag.nl/collections/pand/items`
- Publicly documented formats:
  - 3D Tiles v1.1 (tileset/content in `EPSG:4978`)
  - 3DBAG API features with BAG `pand` identifiers (eg `NL.IMBAG.Pand...`)
- Viewer URL camera parameters supported:
  - `rdx`, `rdy`, `ox`, `oy`, `oz`

## Included modules

- `src/shared/data/3dbag/bag-viewer-url.js`
  - Parse/create viewer links with `rdx/rdy/ox/oy/oz` camera parameters.
- `src/shared/data/3dbag/bag-3d-client.js`
  - 3DBAG endpoint constants + URL builders (`pand/items` and 3D Tiles template).
- `src/shared/data/3dbag/bag-3d-normalize.js`
  - Normalize API payloads and BAG `pand` identifiers.
- `src/shared/data/3dbag/bag-3d-projection.js`
  - Minimal, documented RD→WGS84 helper for sandbox alignment.
- `src/apps/sandbox/3dbag-alignment-v1/oc-3dbag-layer.js`
  - Web Component lifecycle + map wiring + status/selection events.
- `src/apps/sandbox/3dbag-alignment-v1/oc-3dbag-alignment-layer.js`
  - Backward-compatible alias custom element.

## Event contract

`oc-3dbag-layer` emits:

- `oc-3dbag-layer-status`
  - `{ strategy, bbox, featureCount, bagViewerUrl }`
- `oc-3dbag-building-activate`
  - `{ bagPandId, attributes, source: "3dbag" }`

## How to run

1. `pnpm site:preview`
2. Open:
   `http://localhost:4321/src/apps/sandbox/3dbag-alignment-v1/index.html`

## Notes

- This spike does **not** copy the official viewer implementation code.
- Current rendering strategy in this sandbox is intentionally 2D footprint overlay (`pand/items`) for quick map alignment + selection validation.
- The layer component boundary keeps the data/render strategy replaceable for a future 3D Tiles-rendered pass.
