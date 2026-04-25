# 3DBAG alignment sandbox (v1)

Small framework-free sandbox that composes the shared `<oc-map>` primitive and overlays 3DBAG `pand` footprints for the current viewport bbox.

## Purpose

- Demonstrate the fetch path: map bbox -> `https://api.3dbag.nl/collections/pand/items`.
- Render API results on the same coordinate space as `oc-map` (MapLibre) for visual alignment checks.
- Keep implementation intentionally small, review-friendly, and dependency-free.

## How to run

1. Start the local static server from repo root:
	- `pnpm site:preview`
2. Open:
	- `http://localhost:4321/src/apps/sandbox/3dbag-alignment-v1/index.html`

## Notes

- The sandbox requests data on initial map ready and after viewport move-end events.
- Requests are lightly debounced and previous in-flight requests are aborted.
- Overlay rendering currently filters to Polygon / MultiPolygon geometries.
