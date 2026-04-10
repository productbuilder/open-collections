# Collection Browser Refactor Plan

## 1. Summary

### Problem (plain language)
The browser experience is currently split across two app paths that load and shape data differently. In practice, the list-oriented flow in `collection-browser` and the map-oriented flow in `timemap-browser` do not consistently share one ingestion pipeline and one runtime data model. This creates drift: a source configured in one place is not automatically guaranteed to appear in both surfaces.

### Proposed solution (plain language)
Introduce `collection-browser-shell` as the single orchestration and data-ingestion layer for browser use cases. It should ingest configured sources once, normalize once into a shared local runtime data layer, and provide adapted outputs to thin surface apps:
- `collection-browser-list` for list/browse UX
- `collection-browser-map` for map/spatial UX

The list and map surfaces should consume the same normalized runtime data and should not perform independent raw manifest fetching.

## 2. Current Situation

### Confirmed observations
- `collection-browser` has config-driven source registration via `src/apps/collection-browser/src/config.js` (`embeddedSourceCatalog`).
- `collection-browser` includes its own manifest loading and normalization flow in app/runtime code.
- `timemap-browser` currently uses `loadCollectionSpatialResponse` from `src/apps/timemap-browser/src/services/collection-spatial-loader.js`.
- That loader currently fetches a hardcoded local manifest (`hilversum-wikimedia`) via `HILVERSUM_COLLECTION_MANIFEST_URL`, instead of consuming centrally registered sources.

### Assumptions (to validate during implementation)
- Additional map/list ingestion paths may exist that are partially duplicated or inconsistent in edge-case normalization.
- Route and query state behavior between list and map is not yet fully unified.

### Consequences
- Inconsistent data availability between list and map.
- Duplicated loading logic and normalization effort.
- Harder debugging because data enters via multiple pipelines.
- Harder onboarding for new collections because registration does not guarantee cross-surface availability.

## 3. Target Architecture

The target architecture is a layered pipeline:

1. Registration
- Source entries are declared in one config-driven catalog.

2. Ingestion
- A shell-owned ingestion pipeline resolves sources, collection manifests, and item payloads.

3. Normalization
- Raw source/collection/item payloads are normalized into a canonical runtime model.

4. Shared runtime data layer
- Shell persists normalized entities and indexes in one local store used by all browser surfaces.

5. Surface adapters
- Adapters project normalized entities into surface-specific view models (list/map).

6. Surface apps
- List and map surfaces render adapted view models and emit interaction/query events back to shell.

## 4. Proposed Module Responsibilities

### `collection-browser-shell`
- Own source registration from config.
- Own ingestion lifecycle (fetch source manifests, collection manifests, item payloads).
- Own normalization into canonical entities.
- Own shared runtime data layer state and indexes.
- Own routing of normalized data into adapters.
- Own coordination of shared query/filter state where needed.

### `collection-browser-list`
- List-focused browser surface only.
- Request list projections from list adapter.
- Render rows/cards/facets from adapted data.
- Emit user-intent events (selection, filter, sort, paging) to shell.
- No direct raw manifest fetch.

### `collection-browser-map`
- Map-focused browser surface only.
- Request spatial projections from map adapter.
- Render features/layers/overlays from adapted data.
- Emit viewport/filter/selection events to shell.
- No direct raw manifest fetch.

## 5. Data Flow

End-to-end flow:

1. Config registers source entries.
2. `collection-browser-shell` resolves and fetches source manifests.
3. Shell fetches collection manifests and item payloads.
4. Shell normalizes source/collection/item data into a canonical runtime model.
5. Shell stores `sources`, `collections`, `items`, and indexes in a shared local data layer.
6. Shell invokes list adapter or map adapter based on requested surface/query.
7. Surface app renders adapted data on demand and sends interactions back to shell.

## 6. Shared Data Layer

Possible canonical model (example):
- `sourcesById`
- `collectionsById`
- `itemsById`
- `itemsByCollectionId`
- `collectionsBySourceId`
- indexes for tags, dates, spatial coordinates, and stable identifiers

Why this is the canonical source of truth:
- Every surface reads from the same normalized entities.
- Ingestion and normalization become centrally observable and testable.
- Query/filter behavior can be made consistent across list and map.
- Adapter outputs can evolve without changing raw ingestion contracts.

## 7. Adapter Model

- List adapter converts normalized runtime entities into list rows/cards and filter metadata.
- Map adapter converts normalized runtime entities into spatial features and filter metadata.
- Adapters do not fetch manifests directly.
- Adapters consume normalized runtime data only.

## 8. Benefits

- Fetch once, normalize once, adapt many times.
- Consistent list/map data availability.
- Less duplicated loading logic.
- Easier debugging with a single ingestion and normalization path.
- Easier onboarding of new collections (register once, available everywhere by default).
- Easier future additions (for example compare/timeline/presentation adapters) without reworking ingestion.

## 9. Migration Strategy

Incremental path:

1. Document current ingestion and normalization flows in both list and map code paths.
2. Introduce a shell-owned ingestion service under `collection-browser-shell` boundaries.
3. Introduce shared runtime data store and canonical normalized model.
4. Migrate list surface to consume shared store through list adapter.
5. Migrate map surface to consume shared store through map adapter.
6. Remove hardcoded, surface-specific manifest loading.
7. Keep compatibility shims where practical during transition.

## 10. Risks / Open Questions

- Shell ownership boundaries: what belongs in shell vs adapters vs surfaces?
- Caching and invalidation strategy for source/collection/item refresh.
- Lazy vs eager ingestion policies.
- Startup ingestion budget: how much data to ingest upfront?
- Route and state synchronization between list and map.
- Naming/package boundary implications when introducing `collection-browser-shell`, `collection-browser-list`, and `collection-browser-map`.
- Backward compatibility requirements for existing entry points and URLs.

## 11. Recommendation

Proceed with a shell-centered ingestion and shared data-layer refactor.

Treat list and map as thin surface consumers over a shared normalized runtime model, with `collection-browser-shell` as the explicit orchestration layer.

---

## Naming Clarification

`collection-browser` and `timemap-browser` have effectively evolved into list-browser and map-browser roles. Introducing `collection-browser-shell` makes this architecture explicit: one orchestrator plus two focused surfaces.
