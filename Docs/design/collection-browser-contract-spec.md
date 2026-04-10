# Collection Browser Contract Spec

## 1. Purpose

This document defines the canonical ingestion and runtime data contracts for the browser refactor.

It is the contract source for:
- `collection-browser-shell` (ingestion, normalization, store ownership)
- `collection-browser-list` (list projection consumer)
- `collection-browser-map` (map projection consumer)

Normative terms:
- `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY` are used as RFC-style requirements.

## 2. Contract Layers

Contracts are defined in six layers:

1. Registration-time config entries
- Shell intake contract for configured sources.

2. Fetched source/catalog descriptors
- Normalized representation of source catalogs and referenced collections.

3. Fetched collection manifests
- Normalized manifest payload before canonical entity mapping.

4. Canonical normalized entities
- Runtime `SourceEntity`, `CollectionEntity`, `ItemEntity` with canonical IDs.

5. Runtime store/index contracts
- Canonical store maps, relation maps, and index contracts.

6. Adapter input/output contracts
- List/map adapter interfaces over canonical store state.

## 3. Registration Contracts

### 3.1 `SourceRegistrationEntry`

```ts
interface SourceRegistrationEntry {
  sourceId: string;                 // REQUIRED, stable in config scope
  label: string;                    // REQUIRED
  sourceType: "source.json" | "collection.json"; // REQUIRED
  entryUrl: string;                 // REQUIRED, absolute or relative URL

  // OPTIONAL display metadata
  organizationName?: string;
  curatorName?: string;
  placeName?: string;
  countryName?: string;
  countryCode?: string;

  // OPTIONAL ingestion/runtime flags
  enabled?: boolean;                // default true
  priority?: number;                // lower = earlier ingest, default 100
  tags?: string[];                  // registration-level labels
  options?: {
    lazy?: boolean;                 // default false
    maxCollections?: number | null; // no limit when null/undefined
    maxItemsPerCollection?: number | null;
  };

  // OPTIONAL passthrough for diagnostics/audit
  meta?: Record<string, unknown>;
}
```

### 3.2 Rules

- `sourceId`, `label`, `sourceType`, `entryUrl` MUST be present.
- `sourceId` MUST be unique within a shell runtime.
- `entryUrl` MUST be normalized to absolute URL before fetch.
- Disabled entries (`enabled: false`) MUST NOT be ingested.
- Unknown fields MAY be retained in `meta` but MUST NOT affect canonical behavior.

## 4. Fetched Descriptor Contracts

### 4.1 `SourceDescriptor`

This is the normalized result of resolving a registration entry.

```ts
interface SourceDescriptor {
  sourceId: string;                 // from registration
  sourceType: "source.json" | "collection.json";
  sourceUrl: string;                // resolved absolute URL of source entry

  // For sourceType = "source.json"
  catalog?: {
    title?: string;
    organizationName?: string;
    curatorName?: string;
    placeName?: string;
    countryName?: string;
    countryCode?: string;
    collections: CollectionRef[];
    raw?: Record<string, unknown>;
  };

  // For sourceType = "collection.json"
  directCollection?: CollectionRef;
}

interface CollectionRef {
  collectionRefId: string;          // descriptor-local stable id
  manifestUrl: string;              // resolved absolute URL
  label?: string;
  description?: string;
  raw?: Record<string, unknown>;
}
```

### 4.2 Representation rules

- For `sourceType = "collection.json"`, descriptor MUST expose `directCollection` and MUST NOT require `catalog.collections`.
- For `sourceType = "source.json"`, descriptor MUST expose `catalog.collections`.
- All `manifestUrl` values MUST be absolute after normalization.
- Empty collection refs in a source catalog SHOULD generate warnings; ingestion MAY skip them.

## 5. Collection Manifest Contracts

### 5.1 `NormalizedCollectionManifest`

This is the normalized representation of a fetched collection manifest, before canonical entity mapping.

```ts
interface NormalizedCollectionManifest {
  manifestUrl: string;              // absolute URL actually fetched
  sourceId: string;                 // owning source registration id
  collectionId: string;             // normalized collection id
  rawCollectionId?: string;

  metadata: {
    title: string;
    description?: string;
    publisher?: string;
    license?: string;
    attribution?: string;
    language?: string;
    homepageUrl?: string;
    updatedAt?: string;
    raw?: Record<string, unknown>;
  };

  items: NormalizedManifestItem[];
}

interface NormalizedManifestItem {
  rawItemId?: string;
  include: boolean;                 // default true

  title: string;
  description?: string;
  creator?: string;
  sourceUrl?: string;
  tags: string[];
  type?: string;

  media: {
    type: string;                   // normalized lower-case type/subtype token
    url: string;                    // absolute when resolvable
    thumbnailUrl?: string;          // absolute when resolvable
    mimeType?: string;
  };

  location?: {
    lat?: number;
    lon?: number;                   // canonical longitude field
    name?: string;
    raw?: Record<string, unknown>;
  };

  temporal?: {
    display?: string;
    rawDate?: string;
    startMs?: number;
    endMs?: number;
    known: boolean;
  };

  raw?: Record<string, unknown>;
}
```

### 5.2 Semantics

- `include` defaults to `true` when absent.
- Media URLs SHOULD be resolved relative to `manifestUrl` when relative.
- `location.lng` and `location.lon` in raw payload MUST normalize to canonical `lon`.
- Temporal parsing MAY produce unknown temporal state (`known: false`) without dropping item.
- Non-canonical fields MAY be preserved in `raw`.

## 6. Canonical Entity Contracts

### 6.1 `SourceEntity`

```ts
interface SourceEntity {
  sourceId: string;                 // canonical
  label: string;
  sourceType: "source.json" | "collection.json";
  sourceUrl: string;

  organizationName?: string;
  curatorName?: string;
  placeName?: string;
  countryName?: string;
  countryCode?: string;

  registrationMeta?: Record<string, unknown>;
  descriptorMeta?: Record<string, unknown>;
}
```

### 6.2 `CollectionEntity`

```ts
interface CollectionEntity {
  collectionId: string;             // canonical
  rawCollectionId?: string;
  sourceId: string;                 // parent source
  manifestUrl: string;

  title: string;
  description?: string;
  publisher?: string;
  license?: string;
  attribution?: string;

  itemCount: number;
  includedItemCount: number;
  hasSpatialItems: boolean;
  hasTemporalItems: boolean;

  meta?: Record<string, unknown>;
}
```

### 6.3 `ItemEntity`

```ts
interface ItemEntity {
  itemRef: string;                  // canonical ItemRef
  rawItemId?: string;
  sourceId: string;
  collectionId: string;

  title: string;
  description?: string;
  creator?: string;
  sourceUrl?: string;
  include: boolean;

  tags: string[];                   // normalized lower-case deduped tokens
  type?: string;                    // normalized lower-case token

  media: {
    type: string;
    url: string;
    thumbnailUrl?: string;
    mimeType?: string;
  };

  spatial: {
    hasCoordinates: boolean;
    lat?: number;
    lon?: number;
    locationLabel?: string;
  };

  temporal: {
    known: boolean;
    display?: string;
    startMs?: number;
    endMs?: number;
  };

  raw?: Record<string, unknown>;
}
```

## 7. Item Identity Strategy

### 7.1 Canonical contract

- `ItemRef` is canonical across shell, adapters, and surfaces.
- Recommended canonical format:
  - `ItemRef = <CollectionId>#<RawItemIdOrOrdinal>`

### 7.2 Required rules

- `ItemRef` MUST be deterministic for a given normalized collection payload.
- `ItemRef` MUST be unique within runtime store.
- `rawItemId` is metadata and MUST NOT be used as cross-surface key.
- Surface-local IDs MUST map 1:1 back to `ItemRef`.
- Deep links SHOULD encode `collectionId` + `itemRef` (or directly `itemRef`) rather than raw item IDs.

### 7.3 Reconciliation rules

- Raw IDs: stored in `rawItemId`, not authoritative.
- Composite legacy IDs (e.g. `collectionId::itemId`): MAY be accepted as compatibility inputs at shell boundary, but MUST normalize to canonical `ItemRef`.
- Adapter outputs MUST include `itemRef` and MUST NOT omit it.

### 7.4 Example

```json
{
  "collectionId": "hilversum-wikimedia",
  "rawItemId": "image-42",
  "itemRef": "hilversum-wikimedia#image-42"
}
```

Fallback when raw item id missing:

```json
{
  "collectionId": "hilversum-wikimedia",
  "rawItemId": null,
  "itemRef": "hilversum-wikimedia#ord-000042"
}
```

## 8. Runtime Store Contract

### 8.1 `BrowserRuntimeStore`

```ts
interface BrowserRuntimeStore {
  sourcesById: Map<string, SourceEntity>;
  collectionsById: Map<string, CollectionEntity>;
  itemsById: Map<string, ItemEntity>; // key = itemRef

  collectionsBySourceId: Map<string, string[]>; // sourceId -> collectionIds
  itemsByCollectionId: Map<string, string[]>;   // collectionId -> itemRefs

  indexes: {
    tags: Map<string, string[]>;      // tag -> itemRefs
    types: Map<string, string[]>;     // type -> itemRefs
    temporal: {
      knownItemRefs: string[];
      byStartMs?: Array<{ itemRef: string; startMs: number; endMs: number }>;
      minStartMs?: number;
      maxEndMs?: number;
    };
    spatial: {
      georeferencedItemRefs: string[];
      byCell?: Map<string, string[]>; // optional tiling/grid index
      bounds?: { minLat: number; minLon: number; maxLat: number; maxLon: number };
    };
  };

  meta: {
    version: number;
    builtAt: string;
    sourceCount: number;
    collectionCount: number;
    itemCount: number;
  };
}
```

### 8.2 Lookup helpers (recommended)

- `getSource(sourceId)` -> `SourceEntity | null`
- `getCollection(collectionId)` -> `CollectionEntity | null`
- `getItem(itemRef)` -> `ItemEntity | null`
- `getCollectionsForSource(sourceId)` -> `CollectionEntity[]`
- `getItemsForCollection(collectionId)` -> `ItemEntity[]`
- `getItemsByTag(tag)` -> `ItemEntity[]`
- `getItemsByType(type)` -> `ItemEntity[]`

### 8.3 Performance/mutability rules

- Lookups by canonical ID MUST be O(1) average.
- Relation/index lookups SHOULD be O(k) where k is result size.
- Store writes MUST be shell-owned only.
- Adapters and surfaces MUST treat store as read-only.
- Store updates SHOULD be versioned (`meta.version`) for cheap projection invalidation.

## 9. Adapter Contracts

### 9.1 Shared adapter constraints

Adapters:
- MUST consume normalized entities only.
- MUST NOT fetch manifests.
- MUST NOT mutate canonical store ownership.
- MUST return outputs keyed by canonical `ItemRef`.

### 9.2 `ListAdapterInput` / `ListAdapterOutput`

```ts
interface ListAdapterInput {
  store: BrowserRuntimeStore;
  query: {
    text?: string;
    sourceIds?: string[];
    collectionIds?: string[];
    types?: string[];
    tags?: string[];
    timeRange?: { startMs?: number; endMs?: number };
    pagination?: { offset?: number; limit?: number };
    sort?: { key: "title" | "date" | "source"; direction: "asc" | "desc" };
  };
}

interface ListAdapterOutput {
  sourceCards: Array<{ sourceId: string; label: string; count: number }>;
  collectionCards: Array<{ collectionId: string; sourceId: string; label: string; count: number }>;
  itemCards: Array<{
    itemRef: string;
    collectionId: string;
    sourceId: string;
    title: string;
    subtitle?: string;
    previewUrl?: string;
    tags: string[];
    type?: string;
  }>;
  filterOptions: {
    types: Array<{ value: string; count: number }>;
    tags: Array<{ value: string; count: number }>;
  };
  total: number;
}
```

### 9.3 `MapAdapterInput` / `MapAdapterOutput`

```ts
interface MapAdapterInput {
  store: BrowserRuntimeStore;
  query: {
    text?: string;
    sourceIds?: string[];
    collectionIds?: string[];
    types?: string[];
    tags?: string[];
    timeRange?: { startMs?: number; endMs?: number };
  };
  viewport?: {
    center?: { lat: number; lon: number };
    zoom?: number;
    bbox?: { west: number; south: number; east: number; north: number };
  };
}

interface MapAdapterOutput {
  features: Array<{
    itemRef: string;
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: {
      sourceId: string;
      collectionId: string;
      title: string;
      type?: string;
      tags: string[];
      timeStartMs?: number;
      timeEndMs?: number;
      locationLabel?: string;
      previewUrl?: string;
    };
  }>;
  filterOptions: {
    types: Array<{ value: string; count: number }>;
    tags: Array<{ value: string; count: number }>;
  };
  aggregates: {
    totalGeoreferenced: number;
    totalVisible: number;
  };
}
```

## 10. Validation and Normalization Rules

### 10.1 Missing IDs

- Missing `sourceId` in registration: MUST fail registration entry.
- Missing `collectionId` in manifest: MUST generate deterministic fallback (`col-<hash|slug>`).
- Missing `rawItemId`: MUST generate deterministic ordinal fallback for `ItemRef` suffix.

### 10.2 Include flags

- Missing `include`: MUST normalize to `true`.
- `include: false`: item remains representable in diagnostics/raw context but SHOULD be excluded from default adapter outputs unless explicitly requested.

### 10.3 Media normalization

- `media.type` MUST normalize to lower-case token.
- Missing `media.type`: SHOULD default to `image`.
- `media.url` SHOULD resolve relative to manifest URL.
- Missing/invalid `media.url`: SHOULD emit warning; item MAY remain if non-media views still valid.

### 10.4 Location normalization

- Accept `lon` or `lng`; canonical field is `lon`.
- Non-finite/out-of-range coordinates MUST set `hasCoordinates=false` and drop numeric coordinates.

### 10.5 Temporal normalization

- Raw date/range strings SHOULD parse into `startMs`/`endMs` when possible.
- Unparseable dates MUST set `temporal.known=false` without dropping item.
- If only one bound is known, normalizer MAY set both bounds to same instant/day range depending on parser policy.

### 10.6 Tags/type normalization

- Tags MUST normalize to trimmed lower-case deduped tokens.
- `type` MUST normalize to trimmed lower-case token.
- Empty tokens MUST be removed.

### 10.7 Warning/error behavior

- Hard failures (reject ingest unit): invalid registration contract, fetch failures, non-object manifest roots.
- Soft warnings (continue ingest): missing optional metadata, missing coordinates, unparseable dates, missing raw item IDs.
- Shell SHOULD expose warning diagnostics counters per source/collection.

## 11. Backend/Frontend Split

### Shared contracts (frontend + backend)

Pure data contracts that SHOULD be shared:
- Registration entry schema (when backend-driven config exists)
- Source descriptor schema
- Normalized collection manifest schema
- Canonical entity schemas (`SourceEntity`, `CollectionEntity`, `ItemEntity`)
- `ItemRef` rules
- Runtime index payload schemas (if backend precomputes indexes)
- Adapter I/O payload schemas when adapters can run server-side

### Runtime/browser-specific concerns

- In-browser store implementation details (`Map` usage, mutation batching)
- DOM event contracts and component-specific state
- Viewport event cadence/debounce behavior
- Surface rendering models not required for backend computation

## 12. File/Module Recommendations

Recommended placement (docs first, then future types/schemas):

- Spec doc (this file):
  - `docs/design/collection-browser-contract-spec.md`

- Future shared contract modules:
  - `src/shared/data/browser-contracts/registration-contract.js`
  - `src/shared/data/browser-contracts/descriptor-contract.js`
  - `src/shared/data/browser-contracts/manifest-contract.js`
  - `src/shared/data/browser-contracts/entity-contract.js`
  - `src/shared/data/browser-contracts/store-contract.js`
  - `src/shared/data/browser-contracts/adapter-contract.js`

- Optional schema layer (if JSON Schema is adopted):
  - `src/shared/data/browser-contracts/schemas/*.schema.json`

- Shell-specific runtime/store implementation (non-contract):
  - `src/apps/collection-browser-shell/src/runtime/*`

## 13. Open Questions

Only unresolved items that need explicit decisions:

1. Final `ItemRef` encoding details
- Keep plain `<collectionId>#<suffix>` or add URI-safe encoding/version prefix.

2. Collection ID fallback strategy
- Hash-based fallback vs slug+ordinal fallback for missing collection IDs.

3. Temporal parser policy
- Precision policy for year/month/day-only values and open ranges.

4. Spatial index shape
- Keep simple georeferenced list first or adopt tile/grid index in v1.

5. Include=false handling in indexes
- Whether excluded items appear in canonical indexes for diagnostics.

6. Backend precompute envelope
- Which indexes are mandatory from backend vs optional frontend recompute.
