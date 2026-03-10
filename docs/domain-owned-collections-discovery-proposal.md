# Domain Collections Discovery (DCD) 0.1

## 1. Title

**Domain Collections Discovery (DCD): A Minimal Well-Known Discovery Standard for Domain-Owned Collections**

## 2. Summary

The web already has strong patterns for discovering human-facing pages and machine-facing metadata. We have `robots.txt` for crawler guidance, RSS/Atom feeds for updates, OpenID and WebFinger for identity-related discovery, and federation protocols for social messaging. These mechanisms prove that simple URL conventions and lightweight documents can bootstrap broad interoperability.

What the web still lacks is a simple, universal way to discover machine-readable collections and datasets that are explicitly published by the domain that claims authority over them. Today, discovery is often fragmented across portal software, ad hoc APIs, platform-specific registries, and custom metadata files. This makes it hard for clients to reliably find authoritative collection endpoints.

Existing approaches are useful but often miss this specific need. Some are too complex for small publishers, some assume centralized infrastructure, and some are too narrow in the kinds of media they model. This proposal defines a small, practical baseline: a standard well-known URL that lists a domain’s published collections, with JSON documents that clients can fetch directly from the publisher’s domain.

## 3. Goals

This proposal has intentionally pragmatic goals:

- Be simple enough to implement with static hosting.
- Make domain ownership and authority explicit.
- Support mixed media, not only tabular records.
- Stay JSON-first and easy to parse in any language.
- Work well with HTTP caching.
- Be indexable by search engines and third-party aggregators.
- Be easy for small publishers to adopt without specialized infrastructure.
- Allow extension over time without making the core model complex.

## 4. Non-goals

This proposal does **not** attempt to solve every metadata problem. Specifically, it does not define:

- Full semantic-web or graph reasoning.
- A universal ontology or controlled vocabulary for all domains.
- Search ranking or recommendation algorithms.
- Authentication, authorization, or identity frameworks.
- Mandatory federation protocols between publishers.
- A global centralized registry of collections.

## 5. Terminology

A few terms are used in a strict, practical sense:

**Collection**  
A published, machine-readable grouping of items under a domain’s authority. A collection may include mixed media (for example images, audio, text, structured records, and 3D models).

**Dataset**  
A subtype of collection where the primary content is structured data records (for example tabular, geospatial, or statistical data). All datasets are collections, but not all collections are datasets.

**Item**  
A single member of a collection. An item may represent a record, object, document, media entry, or other unit chosen by the publisher.

**Asset**  
A concrete file or representation associated with an item (for example a JPEG, MP4, WAV, PDF, GLB, CSV, or JSON file).

**Publisher**  
The domain owner (or explicitly delegated operator) that publishes and maintains collection metadata.

**Discovery document**  
The JSON file at `/.well-known/collections.json` that lists collections claimed by a publisher domain.

**Catalog / indexer**  
A third-party system that crawls and indexes collections from many domains. An indexer is not authoritative; it reflects publisher claims.

## 6. Discovery mechanism

Clients discover collections by requesting:

`https://example.com/.well-known/collections.json`

This discovery document returns a list of collections published by that domain. Each entry points to a canonical collection metadata document.

By default, the canonical URL should be on the same domain. A domain may delegate hosting to another domain, but delegation must be explicit in the discovery document. Authority remains with the publishing domain that serves the discovery file.

This follows familiar web conventions: a predictable URL, a small machine-readable document, and direct retrieval over HTTPS.

## 7. Minimal JSON format

The discovery document should keep required fields minimal so adoption is easy.

```json
{
  "publisher": "example.com",
  "version": "1",
  "collections": [
    {
      "id": "museum-objects",
      "title": "Museum Objects",
      "type": "collection",
      "url": "https://example.com/collections/museum-objects.json",
      "mediaTypes": ["image", "3d", "text"],
      "license": "CC-BY-4.0",
      "updated": "2026-03-10"
    }
  ]
}
```

Field guidance:

- `publisher` (required): authoritative publishing domain.
- `version` (required): discovery format version string.
- `collections` (required): array of collection descriptors.

Per collection entry:

- `id` (required): stable domain-scoped identifier.
- `title` (required): human-readable name.
- `type` (required): `collection` or `dataset`.
- `url` (required): canonical collection metadata URL.
- `mediaTypes` (optional): broad content categories.
- `license` (optional): default usage license indicator.
- `updated` (optional): last update date (ISO-like string).

The required set is intentionally small (`publisher`, `version`, `collections`, and core entry fields) to support static files and low-friction implementation.

## 8. Collection document

Each collection should expose a canonical metadata document with stable identity and item access information.

Suggested minimal structure:

- `id`
- `type`
- `title`
- `description`
- `publisher`
- `canonical`
- `license`
- `updated`
- `itemCount`
- `itemEndpoint` or `items`
- `mediaTypes`
- `keywords`

Example:

```json
{
  "id": "museum-objects",
  "type": "collection",
  "title": "Museum Objects",
  "description": "Digitized objects from the city museum collection.",
  "publisher": "example.com",
  "canonical": "https://example.com/collections/museum-objects.json",
  "license": "CC-BY-4.0",
  "updated": "2026-03-10T12:00:00Z",
  "itemCount": 125430,
  "itemEndpoint": "https://example.com/collections/museum-objects/items?page=1",
  "mediaTypes": ["image", "3d", "text"],
  "keywords": ["museum", "heritage", "catalog"]
}
```

## 9. Items

Collections may include items in two ways:

1. Embed a small `items` array directly in the collection document (useful for compact collections).
2. Provide an `itemEndpoint` (or manifest URL) for paginated retrieval of larger collections.

An item can reference one or more assets and should stay media-neutral. Assets may include image files, video files, audio files, 3D models, text documents, or structured JSON records.

Example item object:

```json
{
  "id": "obj-0001",
  "type": "item",
  "title": "Bronze Vessel",
  "updated": "2026-03-09T09:30:00Z",
  "assets": [
    {
      "rel": "preview",
      "href": "https://example.com/media/obj-0001/preview.jpg",
      "format": "image/jpeg"
    },
    {
      "rel": "model",
      "href": "https://example.com/media/obj-0001/model.glb",
      "format": "model/gltf-binary"
    },
    {
      "rel": "metadata",
      "href": "https://example.com/media/obj-0001/record.json",
      "format": "application/json"
    }
  ]
}
```

## 10. Why “collections” over “datasets”

This proposal uses **collection** as the top-level concept because it better reflects what publishers actually share on the web: mixed, curated sets of digital objects, not only structured tables.

The term **dataset** remains valid and useful, but as a subtype. In many communities, “dataset” implies primarily statistical or tabular data. That implication is too narrow for archives, museums, media repositories, and hybrid corpora. Using `collection` as the default keeps the standard inclusive while preserving `dataset` for structured-data-heavy cases.

## 11. Relationship to existing approaches

This proposal is designed to complement, not replace, existing systems:

- **Open data portals** provide rich workflows but often require specific software stacks.
- **schema.org / JSON-LD** improves web semantics, but implementations vary and discovery remains inconsistent.
- **Linked Data / RDF** can model deep relationships but is often too heavyweight for small publishers.
- **IIIF manifests** are strong for cultural media presentation but are domain-specific rather than universal discovery.
- **Data catalogs** and registry platforms help aggregation but are frequently centralized.
- **Package registries** solve software/package distribution, not general collection discovery.
- **ActivityPub-style federation** addresses social graph messaging rather than static collection publication.

DCD is narrower by design: one well-known entry point plus minimal JSON documents for authoritative discovery.

## 12. Delegation and authority

Authority defaults to the domain serving `/.well-known/collections.json`. That domain declares which collections it publishes.

Delegated hosting is allowed when explicitly declared. For example, a publisher may list a canonical collection URL on a storage or delivery domain. In that case, clients and indexers should treat the discovery document as the source of truth for the publisher’s claim of authority.

In short: hosting location may vary, but authority starts with the discovery domain.

## 13. Caching and versioning

The model is HTTP-native and cache-friendly:

- Use `ETag` and `Last-Modified` for conditional requests.
- Use clear `Cache-Control` policies appropriate to update frequency.
- Keep canonical URLs stable.
- Keep collection and item IDs stable across updates.
- Include optional version fields for format evolution.

These practices let indexers crawl efficiently while keeping publisher infrastructure lightweight.

## 14. Security and trust considerations

Minimal baseline security and trust assumptions:

- Discovery and metadata URLs should use HTTPS.
- Trust primarily comes from domain control and publisher reputation.
- Indexers may validate consistency (for example, that canonical documents match declared publisher identity).
- Cryptographic signatures may be added as an extension later, but are not required in the minimal standard.

This keeps initial implementation simple while leaving room for stronger verification models.

## 15. Adoption path

A publisher can adopt DCD incrementally with:

1. A static `/.well-known/collections.json` file.
2. One collection metadata JSON file.
3. A small set of hosted item assets.

No database is required. No specialized protocol stack is required. A static site host or object storage bucket with HTTPS can be enough for first deployment.

Publishers can then add pagination, richer item metadata, or delegation only when needed.

## 16. Example use cases

DCD is intentionally broad and practical. Example domains include:

- Museum object collections with images and 3D scans.
- Government open records and public data releases.
- Scientific image repositories and observation archives.
- Public-domain media libraries.
- Product catalogs with structured attributes and media assets.
- Local history archives maintained by libraries or municipalities.
- Domain-owned AI training collections with transparent provenance metadata.

## 17. Open questions

Important questions for future iterations:

- Should the specification recommend a default pagination format for item endpoints?
- Should `mediaTypes` use a fixed vocabulary or remain open-ended?
- Should there be a standard split between collection-level and item-level licensing fields?
- What constraints should apply to delegated hosting across domains?
- Should optional JSON-LD compatibility guidance be included?

## 18. Conclusion

The web is missing a lightweight discovery layer for domain-owned, machine-readable collections. A tiny standard centered on `/.well-known/collections.json` can fill that gap without introducing heavy infrastructure.

By keeping the core model small, JSON-first, and HTTP-native, Domain Collections Discovery can enable a decentralized ecosystem where publishers remain authoritative, indexers remain optional, and collection reuse becomes much easier across domains.
