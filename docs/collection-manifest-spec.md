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
      "thumbnailUrl": "thumbs/harbor-map-001.jpg",
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

Each item summary should include:

- `id` (stable within the collection)
- `title`
- `type`
- `thumbnailUrl`
- `detailUrl`

Recommended for synchronization:

- `updatedAt` (ISO 8601 timestamp)

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
