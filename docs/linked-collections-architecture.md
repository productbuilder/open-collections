# LinkedCollections Architecture

## Overview

LinkedCollections is designed as a lightweight, decentralized system for publishing and discovering collections of digital assets.

The architecture intentionally follows patterns that made the Web scalable:

- decentralized publishing
- simple entry documents
- URL-addressable resources
- indexing for discovery

Rather than storing collections in centralized databases, collections are represented as **portable directories with a manifest file**.

This makes collections easy to publish, host, index, and reuse.

---

# Relationship to the Web

The architecture mirrors the structure of the Web.

| Web Concept | LinkedCollections Concept |
|-------------|---------------------------|
| Website | Collection |
| index.html | collection.json |
| Web page | Item |
| Images/files | Media assets |
| Hyperlinks | References between collections/items |
| Search engine | Indexer |

Just like a website starts with `index.html`, a collection starts with a **manifest**.

Example:

```
https://example.org/collections/harbor/
collection.json
```

The manifest is the entry point for tools such as:

- browsers
- indexers
- editors
- visual explorers

---

# Collection Manifest

The manifest acts as a **lightweight index** of the collection.

It should contain only information required to:

- identify the collection
- list items
- show thumbnails and basic metadata
- locate detailed metadata and media

Example structure:

```
collection/
collection.json
items/
media/
thumbs/
```

The manifest should remain small so it can load quickly and scale to large collections.

---

# Summary vs Detail

To support very large collections, the system separates:

**Collection index (summary)**  
Stored in `collection.json`

**Item detail**  
Stored in `items/{id}.json`

This allows applications to:

- load collection summaries quickly
- fetch item detail only when needed
- avoid loading large datasets at once

Example:

```
collection.json → item summaries
items/*.json → full metadata
```

This follows a key design rule:

> Summary everywhere, detail on demand.

---

# Addressable Resources

A core design rule is that important objects should have stable URLs.

Examples:

Collection

```
https://example.org/collections/harbor/
```

Item

```
https://example.org/collections/harbor/items/harbor-map
```

Media

```
https://example.org/collections/harbor/media/harbor-map.jpg
```

This enables:

- linking
- embedding
- indexing
- cross-collection references

---

# Collections as Portable Units

Each collection is a **portable directory**.

Example:

```
harbor-collection/
collection.json
items/
media/
thumbs/
```

This directory can be hosted anywhere:

- GitHub
- S3
- Netlify
- static hosting
- institutional servers

The only requirement is that `collection.json` is accessible.

---

# Indexing and Discovery

Collections are designed to be discovered by an **indexer**, similar to how search engines crawl websites.

The indexer workflow:

```
seed collection URLs
↓
fetch collection.json
↓
extract items
↓
extract metadata
↓
build search and exploration indexes
```

This enables global discovery without requiring a centralized database.

---

# Relationship to Linked Data

The architecture shares some principles with Linked Data:

- resources have identifiers (URLs)
- resources can reference each other
- datasets can be connected

However, LinkedCollections intentionally keeps the data model simple and developer-friendly.

Instead of requiring RDF or complex semantic frameworks, it uses:

- JSON manifests
- URLs
- indexing

Optional interoperability with systems like JSON-LD or IIIF can be added later.

---

# Collections as a Graph

Collections can reference:

- items in other collections
- external media
- institutional resources

Example:

```
collection A → references item in collection B
collection C → aggregates items from A and B
```

This creates a distributed **graph of collections**.

---

# Collector Role

The Collector application is the authoring environment for LinkedCollections.

Collector responsibilities include:

- creating collections
- managing items
- ingesting assets
- generating thumbnails
- editing metadata
- publishing collections to storage providers

Collector is designed to work with multiple collection types, including:

- cultural heritage collections
- product collections
- material collections

---

# Key Architectural Principles

1. Collections are portable directories
2. `collection.json` is the entry point
3. resources should be URL-addressable
4. manifests remain lightweight
5. detail metadata is loaded on demand
6. indexing enables discovery
7. collections can reference other collections

These principles allow the ecosystem to remain:

- decentralized
- scalable
- easy to host
- easy to index
- easy to extend

---

End of document.
