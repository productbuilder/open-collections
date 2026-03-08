# Collector MVP Implementation Notes

## What was implemented

### Vertical slice delivered

A first end-to-end MVP workflow is implemented:

1. connect to a source (fully working with local example dataset)
2. browse assets as cards
3. open and edit lightweight metadata
4. generate and preview `collection.json`
5. copy/download manifest for TimeMap ingestion handoff

### Implemented modules

- `code/apps/collector-ui/`
  - single-page UI with sections for connection, browser, editor, and manifest export
- `code/packages/collector-schema/`
  - minimal collection/item shape helpers and validation
  - TypeScript interfaces for shared model contract
- `code/packages/provider-core/`
  - provider capability model and helper utilities
- `code/packages/provider-local/`
  - fully working provider loading `examples/test-collection/collection.json`
  - supports list/get/save/export in-session
- `code/packages/provider-public-url/`
  - minimal read-only provider loading a remote manifest URL
- `code/packages/provider-github/`
  - explicit stub with clear TODO behavior and non-working methods
- `examples/test-collection/`
  - MVP dataset and documentation

## What works now

- Local provider connection and asset listing
- Card browser with metadata completeness indicator and license status
- Include/exclude toggle per asset
- Item metadata editing for:
  - title
  - description
  - creator
  - date/period
  - location
  - license
  - attribution
  - source
  - tags
- Manifest generation using current collection metadata + included items
- Manifest validation against minimal required shape
- Manifest copy to clipboard and download as `collection.json`

## What is stubbed / partial

- Public URL provider is read-only in MVP pass:
  - can connect and load a manifest
  - does not persist metadata changes remotely
- GitHub provider is a skeleton only:
  - no auth flow
  - no repo browsing
  - no read/write implementation

## TimeMap handoff

- The generated `collection.json` is the handoff artifact.
- It contains required fields for collection and items in a simple JSON-first format.
- TimeMap ingestion can later consume this manifest via file upload or URL-based fetch.

## Recommended next implementation step

Implement the first real writable remote provider (GitHub or S3-compatible) with:

1. connection configuration and capability checks
2. asset discovery from provider storage
3. metadata save path back to provider
4. manifest publish path to a stable URL

GitHub is likely fastest for a visible demo; S3-compatible is strongest for provider-agnostic long-term direction.
