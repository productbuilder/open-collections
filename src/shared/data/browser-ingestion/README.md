# Browser Ingestion Service

This module owns shell-level ingestion orchestration for browser data:
- registration intake and ordering
- source descriptor resolution (`source.json` and `collection.json`)
- collection manifest fetch orchestration
- canonical entity normalization
- runtime store population through the runtime store `mutate` API
- structured diagnostics summary

Inputs:
- registration entries matching the browser contract spec
- a runtime store created by `src/shared/data/browser-runtime/`
- a fetch implementation (browser or server runtime)

Writes:
- `SourceEntity`, `CollectionEntity`, and `ItemEntity` into the runtime store

Does not own yet:
- UI wiring
- list/map adapter projection
- long-lived TTL/version invalidation cache (current fetch dedupe is per ingestion run)

Diagnostics:
- ingestion returns compatibility fields plus a structured `browser-diagnostics-v1` payload at `result.structured`
- phase/timing visibility includes:
  - `descriptorResolutionMs`
  - `manifestNormalizationMs`
  - `storePopulationMs`
  - `startupIngestionMs`
- summary counts include:
  - ingested source/collection/item counts
  - included/georeferenced/temporal item counts
  - fetch request/network/dedup hit counts

## Cache Boundaries

Current caching is intentionally lightweight and in-memory per ingestion run:

- fetch repository cache:
  - scope: single ingestion run
  - key: absolute URL
  - behavior: dedupe in-flight and repeated fetches in-run
  - bounded by `maxCacheEntries` with oldest-entry eviction
- normalization cache:
  - scope: single ingestion run
  - key: `${sourceId}::${manifestUrl}`
  - behavior: reuse normalized manifest output when same manifest is referenced multiple times in-run

No persistent cache is introduced in this step.
