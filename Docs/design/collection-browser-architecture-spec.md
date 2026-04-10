# Collection Browser Architecture Spec

## 1. Summary

### Problem (plain language)
The browser experience is split into separate list and map app paths that ingest and shape data independently. As a result, source configuration does not automatically guarantee consistent data availability across surfaces, logic is duplicated, and behavior can drift.

### Target solution (plain language)
Introduce a shell-centered architecture where `collection-browser-shell` owns registration, ingestion, normalization, and a shared runtime data layer. `collection-browser-list` and `collection-browser-map` become thin rendering surfaces that consume shell-provided adapter projections from the same normalized source of truth.

## 2. Confirmed Current State

### Confirmed findings
- `collection-browser` uses config-driven source registration (`embeddedSourceCatalog`) in `src/apps/collection-browser/src/config.js`.
- `collection-browser` has embedded ingestion and standalone manifest ingestion in app-local code paths (`src/apps/collection-browser/src/app.js`).
- `timemap-browser` uses an independent ingestion path via `loadCollectionSpatialResponse` in `src/apps/timemap-browser/src/services/collection-spatial-loader.js`.
- At least one active map ingestion path uses a hardcoded manifest URL constant (`HILVERSUM_COLLECTION_MANIFEST_URL`) in `collection-spatial-loader.js`, bypassing centralized config-driven source registration.
- `normalizeCollection` is shared (`src/shared/library-core/src/model.js`), but there is no shell-owned shared runtime data layer used by both list and map.
- List and map currently duplicate parts of projection/filter/type aggregation logic.
- `open-collections-browse-shell` currently switches between child apps (`collection-browser` and `timemap-browser`) and coordinates query patch/state events, but does not own ingestion or canonical data storage.
- Current code has identifier inconsistency risk between source-scoped composite IDs (for some list flows) and raw item IDs (map feature IDs).
- Current map path can re-trigger spatial loads on viewport/filter/time changes, creating repeated manifest fetch risk.

### Assumptions to validate during implementation
- Mode switching may cause practical state resets because current shell behavior re-renders child app markup.
- Additional duplicated normalization or filtering edge cases may exist beyond the already confirmed ones.
- Some startup/embedded paths may depend on current app-local defaults that will need temporary bridges.

## 3. Target Module Boundaries

Use these module boundaries and ownership rules.

### `collection-browser-shell`

Owns:
- source registration intake from config
- descriptor/catalog resolution
- source + collection manifest loading
- item normalization into canonical entities
- shell-owned runtime data store and indexes
- adapter invocation (list/map projections)
- cache and invalidation policy
- ingestion and projection diagnostics
- cross-surface query/state orchestration contract

Must not own:
- low-level list/map rendering details
- surface-specific component presentation logic

### `collection-browser-list`

Owns:
- list-focused rendering only (cards/rows/empty/loading states)
- list interaction events (selection, filter intent, paging/sort intent)
- list-specific view concerns that do not redefine canonical data

Must not own:
- manifest fetching
- source descriptor loading
- collection/item normalization
- canonical runtime store mutation

### `collection-browser-map`

Owns:
- map-focused rendering only (features/layers/selection overlays)
- map interaction events (viewport, feature selection, filter intent)
- map-specific display concerns over adapter-provided models

Must not own:
- manifest fetching
- source descriptor loading
- collection/item normalization
- canonical runtime store mutation

## 4. Canonical Data Lifecycle

Target lifecycle (single pipeline):

1. Config registration
- Shell receives source registration entries from configuration.

2. Source descriptor/catalog loading
- Shell resolves each source entry to either:
  - direct collection manifest reference, or
  - source catalog containing collection manifest references.

3. Source/collection manifest loading
- Shell fetches descriptors and collection manifests through a deduplicated fetch layer.

4. Item normalization
- Shell normalizes collection payloads into canonical entities (reusing shared normalize helpers where applicable).

5. Runtime data-store population
- Shell writes canonical entities and indexes to shell-owned runtime store.

6. Adapter projection
- Shell invokes list adapter or map adapter using canonical entities + query context.

7. Surface rendering
- Surface receives adapted view models and renders on demand.

8. Interaction loop
- Surface emits interaction/query patches to shell.
- Shell updates query/runtime state and recomputes only required projections.

## 5. Shared Runtime Data Layer

The shell owns the canonical runtime model.

### Minimum store shape
- `sourcesById: Map<SourceId, SourceEntity>`
- `collectionsById: Map<CollectionId, CollectionEntity>`
- `itemsById: Map<ItemRef, ItemEntity>`
- `collectionsBySourceId: Map<SourceId, CollectionId[]>`
- `itemsByCollectionId: Map<CollectionId, ItemRef[]>`
- `indexes.tags`
- `indexes.types`
- `indexes.temporal` (date/range)
- `indexes.spatial` (georeference availability + coordinates)

### Canonical identity strategy

Problem to solve:
- Existing flows mix raw item IDs and derived composite IDs (e.g. `collectionId::itemId`), which can break cross-surface selection and linking.

Required strategy:
- Define `ItemRef` as the canonical identifier across shell/list/map.
- `ItemRef` must be globally stable and deterministic within the shell runtime.
- Recommended composition:
  - `ItemRef = <CollectionId>#<RawItemIdOrOrdinal>`
- Preserve raw source fields separately:
  - `item.rawItemId`
  - `item.collectionId`
  - `item.sourceId`
- If raw item ID is missing, generate deterministic fallback from collection scope + item order at normalization time.

Rules:
- All cross-surface references (selection, hover, deep links, adapter output IDs) use `ItemRef`.
- Raw IDs are metadata, never cross-surface keys.
- Surface-specific IDs (e.g. map layer feature IDs) must map 1:1 back to `ItemRef`.

### Canonical vs surface-specific identifiers
- Canonical: `SourceId`, `CollectionId`, `ItemRef`.
- Surface-specific: UI-local row keys, map-renderer internal IDs, virtualized list keys.
- Surface-specific IDs must be derivable from canonical IDs and must not become source of truth.

## 6. Adapter Model

### List adapter
Responsibilities:
- consume canonical store entities and query state
- produce list view models (source cards, collection cards, item cards/rows)
- produce list filter option payloads from canonical indexes
- preserve canonical identity references in outputs

Constraints:
- no network calls
- no raw manifest parsing
- no canonical store ownership

### Map adapter
Responsibilities:
- consume canonical store entities and query/viewport state
- produce spatial features and map filter option payloads
- map temporal/spatial fields from canonical entities
- preserve canonical identity references in outputs

Constraints:
- no network calls
- no raw manifest parsing
- no canonical store ownership

### Invariants
- Adapters consume normalized entities only.
- Adapters do not fetch manifests.
- Surface apps do not perform their own ingestion.

## 7. Performance Principles

This refactor should establish explicit performance rules for larger-scale frontends/backends.

Principles:
- fetch once, normalize once, adapt many times
- deduplicate manifest fetches by URL + revision context
- avoid repeated normalization for unchanged manifests
- do not re-fetch manifests on viewport-only changes
- allow adapter recompute without ingestion reruns
- support incremental loading (per source/collection batches)
- keep seams for future backend precomputation (pre-indexed payloads)
- implement cache + invalidation strategy (TTL/version/manual refresh)
- provide diagnostics counters (fetch count, normalize count, projection count)

Anti-patterns to avoid:
- per-surface manifest fetchers
- adapter-level fetching/parsing
- query changes that trigger full ingestion by default
- duplicated type/tag aggregation logic in each surface

## 8. Migration Architecture

Use incremental migration with compatibility seams.

### Compatibility seams
- Keep current `browse-query-patch` / `browse-query-state` event contract where practical.
- Add bridge layer in shell that can feed legacy surfaces while adapter migration is in progress.
- Keep existing app entries callable until new modules are stable.

### Bridge/flag strategy
- Introduce a feature flag (example: `browserShellDataPipelineV1`) at shell composition level.
- Flag OFF: current behavior.
- Flag ON: shell-owned ingestion/store/adapters drive selected surface(s).

### Suggested migration sequence
- Migrate list surface first:
  - lower coupling to viewport refresh behavior
  - easier validation of ID and filter semantics before map migration
- Then migrate map surface onto the same store and canonical IDs.

### Contract preservation
- Preserve current query/filter payload shape during transition.
- Add compatibility translation only at shell boundary, not inside adapters.

## 9. Risks and Open Questions

- Shell/store ownership: exact boundary between orchestration, adapters, and surfaces.
- Mode switch remount behavior: whether to preserve surface instance state or rely on shell state rehydration.
- Identifier stability: final `ItemRef` scheme and deep-link compatibility.
- Caching/invalidation: refresh policy for source catalogs and manifests.
- Lazy vs eager ingestion: startup latency vs completeness.
- Backend/frontend split: which indexes are precomputed server-side vs derived client-side.
- Package/app boundaries: where `collection-browser-shell`, `collection-browser-list`, and `collection-browser-map` live and how they are versioned.

## 10. Implementation Phases

### Phase 1: Contracts/spec
- finalize canonical entity contracts, `ItemRef` strategy, adapter interfaces, and event compatibility rules
- define ingestion cache/invalidation policy

### Phase 2: Shared runtime store
- implement shell-owned canonical runtime store and index builders
- add diagnostics and store integrity checks

### Phase 3: Shell ingestion service
- implement config registration intake + descriptor/catalog/manifest ingestion pipeline
- deduplicate fetches and normalization

### Phase 4: List adapter migration
- implement list adapter over canonical store
- wire `collection-browser-list` to shell-provided projections
- remove list-surface ingestion paths behind flag

### Phase 5: Map adapter migration
- implement map adapter over canonical store
- wire `collection-browser-map` to shell projections
- remove hardcoded/local-only manifest loaders from map path

### Phase 6: Cleanup/perf/diagnostics
- remove compatibility bridges no longer needed
- remove duplicated projection logic
- tune incremental loading, cache invalidation, and mode-switch state behavior
- finalize documentation and operational diagnostics

## 11. Non-Goals

This refactor does not attempt to solve all browser concerns now.

Non-goals for this scope:
- redesigning visual UI components/styles
- replacing shared query contract shape wholesale
- introducing full backend indexing architecture in this same change
- rewriting unrelated app-shell sections outside browse flow
- solving all future adapter types (compare/timeline/presenter) now
- broad rewrite of collection model semantics beyond identity and normalization seams required for shared ingestion

## Invariants (Must Hold)

- One shell-owned ingestion pipeline.
- One shell-owned canonical runtime store.
- List and map read from the same normalized entities.
- Surface modules never fetch manifests directly.
- Adapters are pure projection layers over normalized data.
- Cross-surface selection and linking use canonical `ItemRef`.

## Explicit Anti-Patterns (Do Not Reintroduce)

- Hardcoded manifest constants in surface-specific loaders.
- Surface-local normalization pipelines that bypass shell store.
- Duplicate filter/type aggregation logic per surface without shared adapter/store ownership.
- Remount-driven state loss without shell-level canonical state recovery.
