# Collection Registry (Registrator) and Collection Indexer

> The Collection Registry keeps track of what is known. The Collection Indexer turns what is known into something searchable, browsable, and explorable.

## 1) Overview

Open Collections Protocol allows collections to be published as ordinary web resources.

On top of that publishing layer, two optional ecosystem tools can be used:

- **Collection Registry** (internal module term: **Registrator**)
- **Collection Indexer**

These tools are not mandatory central infrastructure. Collections can still be published and consumed without them. They exist to make discovery, validation, and cross-collection exploration easier when ecosystems grow.

## 2) Why they are separate

The core distinction is:

- **Collection Registry** = keeps track of known publishers, collections, and registries.
- **Collection Indexer** = fetches and processes known collections to create derived search/browse views.

The registry answers:

- what is known
- who published it
- where it is
- whether it is valid
- whether it has been indexed

The indexer answers:

- what the manifests and item metadata contain
- how to derive browse/search structures from that content
- how viewers, discovery layers, and aggregators can use those derived outputs

This separation prevents the registry from becoming a full search engine and prevents indexing from becoming mandatory for basic publication.

## 3) Why they can still be combined in one app

They are **separate logical modules**, but they can run together in one deployment for early implementations.

Practical first deployment pattern:

- one app process
- one lightweight persistent store
- clear internal boundaries between registry and indexing workflows

This gives a simple operational setup while preserving architecture that can later split into separate services.

## 4) Collection Registry

The Collection Registry tracks:

- known publishers
- known collections
- known registries
- validation state
- indexing state (at registration level)

A key first-class capability: a registry must be able to register **other registries**, not only collections.

## 5) Collection Indexer

The Collection Indexer processes:

- collection manifests
- item metadata
- media references
- derived search and browse structures

It supports downstream tools such as viewers, discovery portals, aggregators, and exploratory interfaces (including TimeMap-like experiences).

The indexer should track indexing jobs and outputs, while the registry stays focused on persistent references and state.

## 6) Federation / linked registries

Federation is core to the registry model.

A registry may:

- register publishers
- register collections
- register other registries
- link to another registry
- harvest summary data from another registry
- optionally mirror another registry

Federation should **preserve provenance**:

- imported records keep source-registry references
- provenance metadata is retained when harvesting or mirroring
- federation should not require full duplication by default

Registries can operate at different levels:

- local
- institutional
- thematic
- national
- global

This enables a network of linked registries rather than one mandatory global hub.

## 7) Indexing modes

Indexing should be staged, not assumed to be internet-wide crawling from day one.

### Mode 1: Registry-driven indexing

Index only known collections discovered via local registry entries, known publishers, or linked registries.

### Mode 2: Scheduled refresh indexing

Periodically re-check known collections and known registries to refresh validation and index outputs.

### Mode 3: Optional broader discovery (later)

Add wider crawling only when needed.

Internet-scale continuous crawling is optional, not required for initial design.

## 8) Persistence and deployment

Registry data must be persistent, but the first implementation can stay lightweight.

Recommended starting approach:

- downloadable / self-hostable deployment
- SQLite-backed or file-backed persistence
- JSON export/import
- optional published registry JSON for static sharing

Later, a hosted shared service can be added without changing the conceptual model.

Blockchain is not part of the core design. If ever used, it should be optional notarization only.

## 9) Minimal first-pass data model

### A. Publisher

```json
{
  "id": "publisher:museum-example-org",
  "type": "publisher",
  "title": "Museum Example",
  "domain": "museum-example.org",
  "dcdUrl": "https://museum-example.org/.well-known/collections.json",
  "status": "active",
  "validationStatus": "valid",
  "lastValidatedAt": "2026-03-10T12:00:00Z"
}
```

A publisher represents a domain or authority that publishes collections.
DCD acts as the domain-level discovery anchor.

### B. Collection registration

```json
{
  "id": "collection:museum-example-org:rotterdam-harbor",
  "type": "collection-registration",
  "publisherId": "publisher:museum-example-org",
  "title": "Rotterdam Harbor Collection",
  "manifestUrl": "https://museum-example.org/collections/rotterdam/collection.json",
  "canonicalUrl": "https://museum-example.org/collections/rotterdam/collection.json",
  "status": "active",
  "validationStatus": "valid",
  "indexingStatus": "indexed",
  "discoveredVia": {
    "type": "publisher-dcd",
    "url": "https://museum-example.org/.well-known/collections.json"
  },
  "lastValidatedAt": "2026-03-10T12:10:00Z",
  "lastIndexedAt": "2026-03-10T12:15:00Z"
}
```

The registry stores collection-level references and state, not full indexed search content.
This is the persistent registry record for a known collection.

### C. Registry

```json
{
  "id": "registry:heritage-netherlands",
  "type": "registry",
  "title": "Netherlands Heritage Registry",
  "registryUrl": "https://example.org/registry.json",
  "authorityDomain": "example.org",
  "operator": "Example Heritage Network",
  "scope": "national",
  "status": "active",
  "validationStatus": "valid",
  "lastValidatedAt": "2026-03-10T12:00:00Z",
  "lastHarvestedAt": "2026-03-10T12:05:00Z"
}
```

A registry record can point to another registry, enabling linked registry networks.

### D. Validation record

```json
{
  "id": "validation:registry:heritage-netherlands:2026-03-10T12:00:00Z",
  "type": "validation-record",
  "targetType": "registry",
  "targetId": "registry:heritage-netherlands",
  "status": "valid",
  "checks": {
    "fetchOk": true,
    "schemaOk": true
  },
  "errors": [],
  "warnings": [],
  "validatedAt": "2026-03-10T12:00:00Z"
}
```

Current status can live on main records, with validation history preserved in separate validation records.

### E. Index job

```json
{
  "id": "index-job:collection:museum-example-org:rotterdam-harbor:2026-03-10T12:12:00Z",
  "type": "index-job",
  "collectionRegistrationId": "collection:museum-example-org:rotterdam-harbor",
  "status": "completed",
  "trigger": "registry-harvest",
  "startedAt": "2026-03-10T12:12:00Z",
  "finishedAt": "2026-03-10T12:15:00Z"
}
```

This belongs to the indexer workflow and tracks indexing activity without turning the registry into the full search backend.

### Starter status vocabularies

Collection registration status:

- `draft`
- `pending_validation`
- `active`
- `inactive`
- `error`

Validation status:

- `unknown`
- `valid`
- `warning`
- `invalid`

Indexing status:

- `not_indexed`
- `pending`
- `indexed`
- `partial`
- `failed`

## 10) Relationship to the broader ecosystem

- **Open Collections Protocol**: base publishing and interoperability layer.
- **LinkedCollections**: linked-data and cross-collection relationship patterns that can inform indexing and aggregation.
- **DCD (Domain Collections Discovery)**: domain discovery anchor used by registries and indexers.
- **Collection Manager**: helps create and publish collections.
- **Collection Registry (Registrator)**: keeps track of known publishers, collections, and registries.
- **Collection Indexer**: processes known collections into searchable/browsable derived structures.
- **Collection Browser**: consumes published and/or indexed outputs for public exploration.
- **TimeMap**: uses indexed/published collection data for cross-collection, temporal, and contextual exploration.
- **Publishers**: host authoritative manifests and media.
- **Viewers and aggregators**: consume indexed or directly published outputs.

## Scope boundary summary

- Collection Registry is not the same as Collection Indexer.
- Registry should not become a full search engine by default.
- Indexer should not become mandatory for basic publication.
- Both are optional ecosystem tools above the core protocol.
