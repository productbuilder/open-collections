# timemap-collector

TimeMap Collector is shipped as a reusable Web Component:

`timemap-collector`

It uses Shadow DOM and provides a SaaS-style shell for provider connection, asset browsing, metadata editing, and manifest export.

## Quick links

- Landing page: `./index.html`
- Demo page: `./demo/`
- Docs page: `./docs/`
- Collector app entry: `./code/apps/collector-ui/`
- Example dataset: `./examples/test-collection/`

## Web Component usage

```html
<script type="module" src="/code/apps/collector-ui/src/index.js"></script>
<timemap-collector></timemap-collector>
```

## MVP currently does

- Provider selection dialog with a multi-provider roadmap UI
- Working providers:
  - GitHub (authenticated via Personal Access Token, read + import + manifest export)
  - Public URL manifest (working, read-only)
  - Example dataset (working, local)
- Planned placeholders (disabled in UI):
  - Google Drive
  - S3-compatible storage
  - Wikimedia Commons
  - Internet Archive
- Browse assets as cards with thumbnail, metadata completeness, license, and include/exclude state
- Edit metadata for selected assets in the sidebar
- Generate, preview, copy, and download `collection.json`

## GitHub provider (this MVP pass)

Implemented:
- Token-based authentication (`repo` scope PAT recommended)
- Repository configuration: owner, repo, branch, folder/path
- Recursive media discovery from the configured path (image/video files)
- Load GitHub assets into the existing Collector card grid
- Continue using metadata editing and manifest export on loaded assets

Not yet implemented:
- Browser OAuth/GitHub App flow
- Metadata write-back to GitHub
- Writing `collection.json` back into the repository

## Run locally

Serve the repository root as static files:

```bash
python -m http.server 8080
```

Then open:

- <http://localhost:8080/>
- <http://localhost:8080/demo/>
- <http://localhost:8080/code/apps/collector-ui/>

## Repository structure

```text
code/apps/              -> app implementations
code/packages/          -> shared packages and providers
examples/               -> example collections and test data
demo/                   -> demo / consumer-style entry page
docs/                   -> documentation page
src/                    -> lightweight root web entry layer
index.html              -> landing page
projects/               -> planning and architecture docs
```
