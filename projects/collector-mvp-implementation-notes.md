# Collector MVP Implementation Notes

## What was implemented

### Vertical slice delivered

A provider-centered MVP workflow is implemented:

1. open provider dialog and choose a source/provider
2. connect to a working provider (local, public URL, or GitHub)
3. browse assets as cards
4. edit lightweight metadata in-app
5. generate and preview `collection.json`
6. copy/download manifest for TimeMap ingestion handoff

### Implemented modules

- `code/apps/collector-ui/`
  - single-page UI with provider picker dialog, browser, editor, and manifest export
- `code/packages/collector-schema/`
  - minimal collection/item shape helpers and validation
  - TypeScript interfaces for shared model contract
- `code/packages/provider-core/`
  - provider descriptor + capability model and helper utilities
- `code/packages/provider-local/`
  - working provider loading `examples/test-collection/collection.json`
  - supports list/get/save/export in-session
- `code/packages/provider-public-url/`
  - read-only provider loading a remote manifest URL
- `code/packages/provider-github/`
  - first working authenticated provider (PAT token config)
  - reads media assets from configured owner/repo/branch/path
  - integrates with asset grid and manifest export
- `examples/test-collection/`
  - MVP dataset and documentation

## What works now

- Provider selection UI with enabled vs planned/disabled provider cards
- Local provider connection and asset listing
- Public URL provider connection (read-only)
- GitHub provider connection using Personal Access Token + repo configuration
- Recursive GitHub media discovery (image/video files)
- Card browser with metadata completeness indicator and license status
- Include/exclude toggle per asset
- Metadata editing for selected assets
- Manifest generation + validation + preview + copy + download

## What is stubbed / partial

- GitHub provider is read-only in this pass:
  - no metadata write-back to GitHub
  - no repository write of `collection.json`
  - no browser OAuth/GitHub App flow yet
- Planned provider placeholders (disabled):
  - Google Drive
  - S3-compatible storage
  - Wikimedia Commons
  - Internet Archive

## TimeMap handoff

- Generated `collection.json` remains the handoff artifact.
- It contains collection + item fields in JSON-first format.
- TimeMap ingestion can consume this manifest via file upload or URL-based fetch.

## Recommended next implementation step

Implement authenticated write-back for GitHub:

1. persist edited item metadata as sidecar JSON in repo
2. persist generated `collection.json` in configured path/branch
3. add explicit commit-message config and conflict/error handling
4. then add browser OAuth (or GitHub App) to replace manual PAT entry
