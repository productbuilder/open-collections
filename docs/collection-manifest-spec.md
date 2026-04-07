# Collection Manifest Specification

## Overview

A collection is described by a manifest file called `collection.json`.

This file is the core publication entry point. Applications use it to:

- identify the collection
- list items
- locate item metadata
- locate media resources
- understand optional access capabilities (if present)

The manifest acts as a **collection index**, not a full database.

## Core protocol vs optional capabilities

Open Collections Protocol is designed as:

1. **Core protocol (required):** static-friendly publication with stable URLs, manifest, item detail files, media assets, and DCD discovery.
2. **Optional capabilities (additive):** pagination, filtering, incremental synchronization, and query templates for very large collections.

A collection remains valid without any optional capability fields.

---

## Minimal Core Manifest Structure

```json
{
  "id": "harbor-collection",
  "title": "Harbor Collection",
  "description": "Historic harbor maps",
  "protocolVersion": "1.0",
  "canonicalUrl": "https://museum-example.org/collections/harbor/collection.json",
  "license": "CC BY 4.0",
  "rightsStatement": "https://rightsstatements.org/vocab/InC/1.0/",
  "items": [
    {
      "id": "harbor-map-001",
      "title": "Harbor Map 001",
      "type": "image",
      "media": {
        "thumbnail": "thumbs/harbor-map-001.jpg"
      },
      "location": {
        "lat": 51.9225,
        "lon": 4.47917
      },
      "links": [
        { "type": "relatedTo", "target": "harbor-photo-011" }
      ],
      "detailUrl": "items/harbor-map-001.json",
      "updatedAt": "2025-09-01T12:00:00Z"
    }
  ]
}
```

---

## Top-Level Fields

### `id`

Collection identifier. Keep stable once published.

### `title`

Human-readable title.

### `description`

Optional collection description.

### `protocolVersion`

Recommended protocol version field (for example `"1.0"`).

### `canonicalUrl`

Primary public identifier for the manifest URL.

### `license`

Human-readable or machine-readable license reference.

### `rightsStatement`

Rights statement URI or text.

### `items`

Array of lightweight item summaries.

Detailed metadata should be stored in separate item detail files.

### `capabilities` (optional)

Optional collection access/scalability declarations.

### `queries` (optional)

Optional query templates for clients.

---

## Item Summary Fields

The `items` array in `collection.json` is the **base item summary format** for Open Collections.

Use simple, author-friendly fields as the source of truth in the manifest. Keep this format flat where possible so it can be authored by hand and imported from spreadsheets, while still allowing nested JSON for grouped fields like location and links.

Recommended base fields:

- `id` (stable within the collection)
- `title`
- `type`
- `description`
- `media`
- `date` and/or `time`
- `location`
- `tags`
- `license`
- `attribution`
- `source`
- `links`
- `detailUrl`
- `updatedAt` (ISO 8601 timestamp)

### Concise base item example

```json
{
  "id": "harbor-map-001",
  "title": "Harbor Map 001",
  "type": "image",
  "description": "Survey map of the inner harbor.",
  "media": {
    "thumbnail": "thumbs/harbor-map-001.jpg",
    "primary": "media/harbor-map-001.jpg"
  },
  "date": "1898-01-01",
  "time": "1898-01-01T00:00:00Z",
  "location": {
    "name": "Rotterdam Harbor",
    "lat": 51.9225,
    "lon": 4.47917
  },
  "tags": ["harbor", "map", "survey"],
  "license": "CC BY 4.0",
  "attribution": "City Archives Rotterdam",
  "source": {
    "recordUrl": "https://archive.example.org/records/harbor-map-001"
  },
  "links": [
    { "type": "sameAs", "target": "https://www.wikidata.org/wiki/Q34370" },
    { "type": "relatedTo", "target": "harbor-photo-011" }
  ],
  "detailUrl": "items/harbor-map-001.json",
  "updatedAt": "2025-09-01T12:00:00Z"
}
```

### Why `location.lat` / `location.lon` in the base format

- It is simple to author and validate in JSON and spreadsheet workflows.
- It supports immediate map and timemap placement without requiring GeoJSON tooling.
- It keeps core item metadata compact and readable in the manifest.

### Why GeoJSON is derived, not primary

GeoJSON remains useful for map rendering, geometry operations, and interoperability. However, for core collection authoring:

- base item metadata should stay lightweight and easy to edit;
- point coordinates should remain easy to import from flat columns;
- richer geometry can be generated into derived map artifacts when needed.

In practice: keep authoring truth in base item fields, derive GeoJSON in render/index pipelines.

### Why `links` is preferred over `relations`

Use `links` as the base field name in item summaries because it is straightforward for authors and implementation-friendly across apps.

Each link object should include:

- `type`: relationship kind (`sameAs`, `relatedTo`, `partOf`, etc.)
- `target`: target ID or URL

This preserves explicit linked-data behavior without forcing heavier relation modeling in the base manifest.

### Spreadsheet-to-nested JSON mapping guidance

Spreadsheet authoring should map flat columns into nested JSON paths during import.

Example column mapping:

- `id` → `id`
- `title` → `title`
- `description` → `description`
- `thumbnail_url` → `media.thumbnail`
- `primary_media_url` → `media.primary`
- `date` → `date`
- `time` → `time`
- `lat` → `location.lat`
- `lon` → `location.lon`
- `location_name` → `location.name`
- `tags` (semicolon-separated) → `tags[]`
- `link_1_type` → `links[0].type`
- `link_1_target` → `links[0].target`
- `detail_url` → `detailUrl`
- `updated_at` → `updatedAt`

This allows non-technical authoring while keeping `collection.json` structured and machine-friendly.

## Item Detail Files

Detailed metadata should be stored in separate files (for example `items/harbor-map-001.json`) and can include:

- `canonicalUrl`
- rights and attribution metadata
- richer domain fields
- namespaced extension objects under an `extensions` key

---

## Identity and Mirrors

- Canonical URLs are primary public identifiers.
- Local IDs are useful internal keys but should not replace canonical URLs.
- Mirror hosting is allowed; canonical references should still be clear.

---

## Extension Model

Use additive extension patterns that avoid collisions:

- namespaced fields
- `extensions` objects
- linked vocabularies when needed

Keep extension fields optional so the base manifest stays simple.

---

## Optional Collection Access Capabilities (Large Collections)

For large collections, listing all items directly in one manifest may become impractical.

Optional access capabilities can expose paged and filtered item access.

```json
{
  "capabilities": {
    "pagination": true,
    "filtering": true,
    "incrementalSync": true
  },
  "itemsPageUrl": "https://museum-example.org/collections/harbor/items?page=1",
  "queries": {
    "itemSearchUrlTemplate": "https://museum-example.org/collections/harbor/items{?page,pageSize,type,updatedAfter}"
  }
}
```

These fields are optional and do not replace core publication files.

---

## Schema Direction

The protocol should maintain JSON Schema definitions for:

- collection manifests
- item records
- optional capability structures

This keeps validation practical while preserving lightweight publication.

---

## Protocol Maturity and Next Steps

The protocol is already useful in production-style publishing flows, while still maturing.

Likely next maturity steps:

- formal versioned specification
- maintained JSON Schemas
- stable compatibility/versioning guidance
- optional access capability profiles
- reference implementations

---

## Design Principles

The manifest should remain:

- small
- readable
- easy to index
- easy to cache
- compatible with static hosting

It should function as a **collection index**, not a full record store.
