# timemap-collector

TimeMap Collector is a lightweight publication and metadata management component for cultural heritage media.
The current MVP proves a practical vertical slice: connect a source, browse assets as cards, edit lightweight metadata, and generate `collection.json` for TimeMap ingestion handoff.

## Quick links

- Landing page: `./index.html`
- Demo page: `./demo/`
- Docs page: `./docs/`
- Collector UI: `./code/apps/collector-ui/`
- Example dataset: `./examples/test-collection/`

## MVP currently does

- Connect to source/provider modes:
  - Example dataset (working)
  - Public URL manifest (working, read-only)
  - GitHub (stub)
- Browse media assets as cards with thumbnail, metadata completeness, license, and include/exclude state
- Open an item and edit lightweight metadata fields
- Generate, preview, copy, and download `collection.json`

## Run locally

Serve the repository root as static files, then open the landing page or demo page.

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
index.html              -> simple landing page
projects/               -> planning and architecture docs
```

## Provider status

- `local/example`: working
- `public-url`: working (read-only)
- `github`: scaffold/stub only
