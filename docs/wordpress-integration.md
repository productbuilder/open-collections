# WordPress Integration in the Open Collections Protocol Ecosystem

WordPress is one practical integration path for publishing, browsing, and lightweight registry participation.

Open Collections Protocol remains the core publication/discovery layer. WordPress is an adoption path, not the protocol itself.

## 1) Why WordPress matters

Many institutions and communities already use WordPress.

That makes it useful for early and incremental protocol adoption:

- familiar admin interface
- lower technical barrier
- practical for smaller organizations and non-technical publishers
- easier integration into existing websites

## 2) How WordPress fits the protocol

A WordPress integration should help publish standard protocol outputs such as:

- collection manifest (`collection.json`)
- item URLs
- media URLs
- DCD discovery file (`/.well-known/collections.json`)
- optional registry export (`registry.json`)

Important design boundary:

- WordPress internals are implementation details
- protocol-facing outputs remain standard web resources that any tool can consume

## 3) Possible WordPress roles

### A. Publishing plugin

- generate or expose `collection.json`
- expose item detail resources
- expose media references
- optionally expose DCD at `/.well-known/collections.json`

### B. Browser integration

- embed Collection Browser views into WordPress pages
- show published collections on institutional/public sites

### C. Manager integration

- embed Collection Manager into WordPress-admin or related workflows
- support collection editing/publishing from familiar CMS environments

### D. Registry integration

- allow WordPress to act as a lightweight Collection Registry
- store known publishers/collections/registries
- publish a machine-readable registry export

## 4) Best first direction

A practical staged adoption path is:

1. publishing collections
2. exposing DCD
3. embedding Collection Browser
4. optionally embedding Collection Manager
5. adding registry support later, or as an optional extension

This keeps the first step manageable.

## 5) Relationship to Collection Registry and Collection Indexer

- WordPress can be one implementation path for publishing and lightweight registry participation
- Collection Registry remains a broader ecosystem tool concept beyond WordPress
- Collection Indexer remains a separate processing layer

A WordPress deployment may include registry and indexing features, but architecture should still keep clear module boundaries.

## 6) Components and embedding

Collection Manager and Collection Browser are not only standalone tools.

They can also be embedded as reusable web components inside systems like WordPress.

That supports:

- flexible attribute/configuration APIs
- integration into public pages, portals, or admin workflows
- protocol outputs that stay standard and reusable

## 7) Why this matters for non-technical users

WordPress integration helps people adopt the protocol without replacing everything at once:

- no need to adopt a full new platform immediately
- collections can be managed through familiar publishing environments
- adoption becomes incremental and practical

## 8) Architectural guidance

Use WordPress as an adapter/integration layer while preserving protocol independence:

- keep protocol-facing outputs independent of WordPress internals
- do not make WordPress-specific storage the public contract
- preserve portable outputs and stable URLs
- keep interoperability as the default goal
