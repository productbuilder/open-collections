# Collection Manifest Specification

## Overview

A collection is described by a manifest file called:

collection.json

This file is the entry point for the collection.

Applications use it to:

- identify the collection
- list items
- locate item metadata
- locate media resources

The manifest acts as a **collection index**, not a full database.

Detailed metadata should be stored in separate item files.

---

# Minimal Manifest Structure

Example:

```json
{
  "id": "harbor-collection",
  "title": "Harbor Collection",
  "description": "Historic harbor maps",
  "version": "1.0",
  "items": [
    {
      "id": "harbor-map-001",
      "title": "Harbor Map 001",
      "type": "image",
      "thumbnailUrl": "thumbs/harbor-map-001.jpg",
      "detailUrl": "items/harbor-map-001.json"
    }
  ]
}
```

---

# Top-Level Fields

## id

Unique identifier for the collection.

Example:

```
"harbor-collection"
```

---

## title

Human-readable title.

Example:

```
"Harbor Collection"
```

---

## description

Optional description of the collection.

---

## version

Optional version identifier.

---

## items

Array of item summaries.

Each item represents a resource within the collection.

The items array should contain **lightweight item summaries** only.

Detailed metadata should be stored separately.

---

# Item Summary Fields

Each item summary should include:

## id

Unique identifier within the collection.

Example:

```
"harbor-map-001"
```

---

## title

Human-readable title.

---

## type

Type of item.

Common values include:

* image
* model
* document
* material
* product

---

## thumbnailUrl

URL of the thumbnail image.

This should load quickly and represent the item visually.

---

## detailUrl

URL pointing to the item detail file.

Example:

```
items/harbor-map-001.json
```

This file contains full metadata.

---

# Item Detail Files

Detailed metadata should be stored in separate files.

Example:

```
items/harbor-map-001.json
```

This allows applications to load item details on demand.

---

# Media Storage

Media assets should be stored in predictable directories.

Example:

```
media/
thumbs/
items/
```

Example structure:

```
collection/
  collection.json
  items/
  media/
  thumbs/
```

---

# Design Principles

The manifest should remain:

* small
* readable
* easy to index
* easy to cache

It should function as a **collection index**, not a full record store.

---

# Future Extensions

Optional extensions may include:

* tags
* dates
* geographic information
* links to other collections
* JSON-LD contexts
* IIIF references

These should remain optional to keep the base specification simple.
