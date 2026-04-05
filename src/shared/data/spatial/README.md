# Shared spatial query contract (v1 scaffold)

This folder defines the first shared contract for map-oriented loading.

## Purpose

Keep shared query semantics aligned with `collection-browser` and `timemap-browser`, while allowing `timemap-browser` to use a different retrieval strategy optimized for viewport and zoom.

## Contract coverage

`spatial-query-contract.js` currently includes:

- `query`: shared filter/query semantics from `src/shared/data/query`
- `viewport`: bbox/center/zoom/bearing/pitch/pixel size input
- `strategy`: retrieval hints (`mode`, density preference, include flags)
- `paging`: simple cursor/limit placeholders for chunked map loading
- `cache`: optional cache hints (`cacheKey`, scope, max age)
- response payload shape with map-oriented placeholders:
  - `features`
  - `clusters`
  - `aggregates` (`totalApprox`, `byType`, `byTimeBucket`)

## Intended usage

- `timemap-browser` can normalize its local query + viewport state into this contract before calling a future loader adapter.
- A future spatial adapter can map this contract to backend-specific APIs (viewport search, tile loading, vector tiles, etc.) without changing app-level state shape.
- Clustering/tile strategies are intentionally placeholders for a later phase; this contract avoids hard-coding any specific backend protocol.

## Notes for future scale

- Keep this contract transport-agnostic so different adapters can support high-density datasets (100k+ points) with mode-dependent payloads.
- Prefer coarse map payloads for broad explore states and richer point payloads for focused contexts.
