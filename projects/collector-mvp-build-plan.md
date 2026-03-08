# TimeMap Collector â€” MVP Build Plan

## 1. Purpose

This document defines the first MVP build plan for TimeMap Collector.

The MVP must prove that:

1. a user can connect to a storage source
2. Collector can browse media assets as cards
3. a user can edit lightweight metadata
4. Collector can publish a collection manifest that TimeMap can ingest

This MVP is intended to validate the core concept and end-to-end workflow, not to deliver the full long-term platform.

## 2. MVP scope

The MVP should include:

- a Collector frontend app
- a minimal storage access/auth layer
- a simple collection data format
- at least one test dataset
- a basic TimeMap import handoff

The first goal is one usable vertical slice that demonstrates the full workflow from source connection to TimeMap ingestion.

## 3. Core user flow

The MVP flow should be:

1. user connects a storage source
2. Collector lists media assets
3. assets are shown as cards with thumbnails/status
4. user opens an asset and edits metadata
5. Collector saves metadata
6. Collector generates or publishes `collection.json`
7. user copies the manifest URL into TimeMap
8. TimeMap ingests the collection

This is the primary flow the MVP must support end to end.

## 4. MVP product components

### 4.1 Collector frontend app

Responsibilities:

- connection setup
- asset browsing
- metadata editing
- collection publishing
- manifest preview

### 4.2 Minimal storage access layer

Responsibilities:

- connection handling
- auth/access handling
- provider-specific read/write operations
- capability checks

### 4.3 Simple collection data format

Responsibilities:

- lightweight item metadata
- collection manifest
- stable IDs
- public media URLs

### 4.4 TimeMap ingestion handoff

Responsibilities:

- accept manifest URL
- parse collection
- import/index items

## 5. MVP screens

### 5.1 Connections screen

Features:

- choose provider type
- create connection
- test connection
- show connection status
- show connection capabilities

### 5.2 Asset browser screen

Features:

- card/grid view
- thumbnail
- filename or title
- metadata completeness status
- rights/license status
- selected/not selected state
- open item action
- include/exclude action

### 5.3 Item editor screen

Features:

- preview media
- title
- description
- date / period
- location
- license
- attribution
- source
- tags
- save action

### 5.4 Publish/export screen

Features:

- generate `collection.json`
- preview collection manifest
- publish/export
- copy manifest URL

## 6. Recommended MVP provider support

The MVP should support only a small number of provider modes:

- Public URL mode
- GitHub public repository mode
- S3-compatible storage mode

Rationale:

- Public URL mode gives the easiest onboarding
- GitHub provides a strong, easy-to-demo public provider
- S3-compatible support proves provider-agnostic architecture

Google Drive, Wikimedia, Microsoft, and other providers should be considered later and are not required for the first MVP.

## 7. Recommended MVP data format

The MVP should use a simple JSON-based format with:

- `collection.json`
- item metadata in JSON
- public media URLs

The MVP may support:

- inline items in `collection.json`
- or per-item metadata files

The first MVP may start with inline items if that simplifies implementation and keeps the end-to-end path small.

The collection manifest is the single entry point for TimeMap ingestion.

## 8. Minimal metadata model

### Required collection fields

- id
- title
- description
- items

### Required item fields

- id
- title
- media
- license

### Recommended item fields

- description
- creator
- date or period
- location
- attribution
- source
- tags

Constraints:

- IDs must be stable
- IDs must not depend only on filenames

Example item JSON:

```json
{
  "id": "itm-1842-map-sheet-01",
  "title": "City Map Sheet 01",
  "media": {
    "type": "image",
    "url": "https://example.org/media/map-sheet-01.jpg"
  },
  "license": "CC-BY-4.0",
  "description": "Survey map of the old harbor district.",
  "creator": "Municipal Survey Office",
  "date": "1842",
  "location": "Rotterdam, NL",
  "attribution": "City Archive",
  "source": "https://example.org/source/map-sheet-01",
  "tags": ["map", "harbor", "survey"]
}
```

Example collection manifest (`collection.json`):

```json
{
  "id": "col-city-archive-sample",
  "title": "City Archive Sample Collection",
  "description": "MVP dataset for TimeMap Collector validation.",
  "items": [
    {
      "id": "itm-1842-map-sheet-01",
      "title": "City Map Sheet 01",
      "media": {
        "type": "image",
        "url": "https://example.org/media/map-sheet-01.jpg"
      },
      "license": "CC-BY-4.0"
    }
  ]
}
```

## 9. Test dataset

The MVP needs a dedicated test dataset to validate product behavior and integration quality.

Recommended test collection characteristics:

- 20 to 50 media files
- mixed dates
- a few locations
- mixed metadata completeness
- varied rights/license cases

Why this dataset is needed:

- UI testing
- metadata editing
- import/export testing
- TimeMap ingestion testing

The repository should include an `examples/test-collection/` folder (or similar) as a stable reference dataset for development and demos.

## 10. Recommended architecture for the MVP

A pragmatic MVP architecture can be built as separate modules within one repository, for example:

- `apps/collector-ui`
- `apps/storage-broker`
- `packages/collector-schema`
- `packages/provider-github`
- `packages/provider-s3`
- `packages/provider-public-url`
- `examples/test-collection`

Even if these modules are deployed together initially, these boundaries keep ownership clear and preserve a clean path for later scaling.

## 11. Implementation order

### Step 1 â€” Freeze the minimal schema

Define the smallest useful collection and item model.

### Step 2 â€” Create a test dataset

Create a realistic example collection for development and demos.

### Step 3 â€” Build the asset browser UI on mock data

Implement cards, item editor, metadata state, and publish flow before real provider integration.

### Step 4 â€” Build the first provider integration end to end

Recommend starting with GitHub or S3.

Notes:

- GitHub is probably easiest for a first visible demo
- S3 is strong for long-term provider-agnostic architecture

### Step 5 â€” Add Public URL mode

Allow basic public-read collection sources with low friction.

### Step 6 â€” Implement TimeMap import handoff

Allow TimeMap to ingest a manifest URL.

## 12. Suggested milestones

### Milestone 1 â€” Static demo

- mock dataset
- cards UI
- metadata editor
- manifest preview

### Milestone 2 â€” First real provider

- GitHub or S3
- read assets
- save metadata
- publish manifest

### Milestone 3 â€” TimeMap ingestion

- paste manifest URL into TimeMap
- import items
- index collection

### Milestone 4 â€” Second provider

- add the next provider mode

## 13. Out of scope for MVP

Out of scope:

- full linked open data stack
- RDF requirement
- SPARQL requirement
- IIIF as a base requirement
- team collaboration workflows
- advanced permissions
- enterprise auth
- bulk editing
- full sync engines
- complex provider matrix
- desktop signing agents

These are future-phase features and should not delay MVP delivery.

## 14. Success criteria

The MVP is successful if:

- a user can connect to at least one real storage provider
- Collector can display media as cards
- a user can edit lightweight metadata
- Collector can publish a valid collection manifest
- TimeMap can ingest the manifest
- the demo works with a realistic test dataset

## 15. Recommended immediate next tasks

1. define the minimal schema
2. create example collection files
3. add test dataset
4. scaffold Collector UI
5. implement mock asset browser
6. implement item metadata form
7. implement manifest preview/export
8. add first provider adapter
9. implement public URL mode or GitHub mode
10. add TimeMap manifest import flow

## 16. Summary recommendation

The first MVP should focus on one vertical slice: simple JSON, one or two provider modes, a realistic test dataset, cards plus lightweight metadata editing, manifest generation, and a working TimeMap import loop.
