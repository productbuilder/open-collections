# Browser Runtime Store

This module provides the shell-owned canonical in-memory runtime data layer for browser ingestion outputs.

It owns:
- canonical entity storage (`sourcesById`, `collectionsById`, `itemsById`)
- source/collection/item relation indexes
- tag/type/temporal/spatial lookup indexes
- mutation version metadata for cheap downstream projection invalidation

It exists to provide one normalized source of truth for future:
- `collection-browser-shell`
- `collection-browser-list`
- `collection-browser-map`

It does not own yet:
- ingestion/fetching pipelines
- list/map adapter projections
- UI state or component wiring

Writer path:
- `store.mutate.*` is the explicit mutation API for shell ingestion code.

Read path:
- `store.get*()` methods return cloned entities and index-derived results.
- Consumers should treat returned values as read-only snapshots.

Diagnostics:
- `store.getDiagnostics()` returns `browser-diagnostics-v1` runtime-store diagnostics:
  - source/collection/item counts
  - included item count
  - georeferenced item count
  - temporal-known item count
