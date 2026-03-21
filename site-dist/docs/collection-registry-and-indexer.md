# Collection Registry (Registrator) and Collection Indexer

> Collection Registry keeps track of what is known. Collection Indexer turns what is known into something searchable and explorable. WordPress can be one practical path for publishing and participating in that ecosystem.

## 1) Overview

Open Collections Protocol is the publication and discovery layer. It defines how collections are published as ordinary web resources.

On top of that layer, optional ecosystem tools can help communities coordinate discovery and reuse:

- **Collection Registry** (internal module name: **Registrator**)
- **Collection Indexer**
- tools such as **Collection Manager** and **Collection Browser**

These are ecosystem tools, not mandatory centralized infrastructure.

## 2) Collection Registry: what it is

**Collection Registry** is a lightweight persistent tool for tracking known collections, publishers, and registries.

It is intentionally practical:

- it can start small
- it does not need a heavy backend from day one
- it can support local, institutional, thematic, national, or global use

It is not the same thing as the Collection Indexer.

## 2.1) Embeddable registry widget

For a lightweight public registration flow, use the embeddable Web Component:

- `open-collections-registry-widget`

Integration details and backend contract are documented in:

- [Registry widget](./registry-widget.md)

## 3) What the registry stores

A first implementation should persist records such as:

- publishers
- collection registrations
- registry registrations
- validation records
- index jobs or indexing state references

In short: it stores what is known and the current operational state around that knowledge.

## 4) Why it exists

The registry exists because collection owners and communities need a practical way to keep track of known resources.

It helps with:

- registering collections in one place
- validating and re-validating known records
- supporting local governance and trust models
- linking registries without requiring one global platform

A registry can register:

- publishers
- collections
- other registries

That linked-registry model supports federation.

## 5) Minimal persistence model

A lightweight-first baseline is recommended:

- SQLite-backed persistence
- JSON export/import
- optional published `registry.json`
- no heavy database server required at first

This gives durability and portability with low operational burden.

## 6) Minimal deployment model

A simple and practical deployment is:

- one small web app
- one SQLite file on disk
- one domain or subdomain
- optional reverse proxy
- optional scheduled backup
- optional export endpoint such as `registry.json`

This model works well for small organizations and early pilots.

## 7) Go binary option

One practical packaging choice is a Go application distributed as a standalone binary.

Why this works well:

- simple install and update path
- no Go toolchain needed when prebuilt binaries are provided
- SQLite fits naturally as file-based persistence
- easy self-hosting on modest infrastructure
- easy backup by copying data files

This is a strong option for downloadable self-hosted deployments.

## 8) Container option

Another practical packaging choice is a container deployment.

Typical pattern:

- run Collection Registry in a container
- mount persistent storage for SQLite/data files
- expose the web UI/API through a domain

Tradeoff:

- users do not need Node.js or Go installed
- users do need a container runtime

This is often a good fit for hosted environments and technical operations teams.

## 9) Hosted option

A shared hosted Collection Registry service can be offered later.

It is useful, but not required for the core architecture.

The core model still works with self-hosted, lightweight deployments.

## 10) Collection Indexer: separate but related

**Collection Registry** and **Collection Indexer** should remain separate in architecture and data model:

- Collection Registry keeps track of known things
- Collection Indexer processes known collections

Collection Indexer processes:

- manifests
- item metadata
- media references
- derived browse/search structures

An early implementation may run both modules together in one app process, while keeping clear logical boundaries.

## 11) Linked registries and federation

Federation is a core requirement.

A registry can:

- register other registries
- link to another registry
- harvest summary data from another registry
- optionally mirror another registry

When importing records, provenance should be preserved:

- retain source registry references
- track import source and timestamps
- avoid losing authority context

## 12) Indexing modes

Collection Indexer does not need to scan the entire internet continuously from day one.

Use staged indexing:

1. **Registry-driven indexing** of known records
2. **Scheduled refresh** of known records
3. **Optional broader discovery** later when needed

This keeps early operations manageable.

## 13) Starter data model (first pass)

### Publisher

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

### Collection registration

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

### Registry

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

### Validation record

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

### Index job

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

## 14) Starter status vocabularies

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
