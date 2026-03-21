# open-collections

Open Collections now contains two focused applications in one repository:

- Collector: writable collection management (edit, publish, register placeholder)
- Browser: read-only collection browsing

## Quick links

- Landing page source: `./index.html`
- GitHub Pages publish output after `pnpm site:build`: `./docs/`
- Site demo: `./site/demo/`
- Site docs: `./site/docs/`
- Site examples: `./site/examples/`
- Internal notes/source markdown: `./notes/`
- Collector app: `./src/apps/manager/`
- Browser app: `./src/apps/browser/`
- WordPress plugin scaffold: `./wordpress/open-collections/`

## App roles

### Collector

- Connect storage sources
- Manage collections per source (collection discovery scaffold where provider support is limited)
- Edit metadata for collection items
- Publish/export `collection.json`
- Open a registration placeholder flow from the header

### Browser

- Load collection manifests
- Browse cards/media/metadata in read-only mode
- No publishing or write controls

## Run locally

Install workspace dependencies once from the repository root:

```bash
pnpm install
```

Serve repository root as static files for the browser-first apps:

```bash
python -m http.server 8080
```

Then open:

- <http://localhost:8080/>
- <http://localhost:8080/src/apps/manager/>
- <http://localhost:8080/src/apps/browser/>
- <http://localhost:8080/site/demo/>

## Structure

```text
src/
  apps/
    manager/
    browser/
    configurator/
  desktop/
    workbench/
  shared/
    platform/
  library/
    core/
  packages/
    collector-schema/
    provider-core/
    provider-github/
    provider-gdrive/
    provider-local/
    provider-public-url/
    provider-s3/

site/
  demo/
  docs/
  examples/

notes/
docs/  # generated GitHub Pages output
projects/
index.html
```

## Notes

- Implementation code now lives under `src/`.
- Site-facing content now lives under `site/`.
- Internal source notes now live under `notes/`.
- `pnpm site:build` writes the publishable localized site to `docs/` for GitHub Pages.
- Registration and richer collection discovery are scaffolded, not fully implemented yet.
- Collector uses OPFS for local draft/workspace persistence when browser support is available.
- Collector supports image ingestion via drag-and-drop and file picker for local drafts.
- Collector supports creating new collections from scratch as local drafts (`New collection`).
- Collection publishing now targets explicit collection roots (for example `<collection-slug>/collection.json`, `<collection-slug>/media/*`, `<collection-slug>/thumbs/*`).
- Collector generates image thumbnails for draft assets when possible.
- GitHub publish uploads originals (`media/`), thumbnails (`thumbs/`), and updates `collection.json`.
- Publishing remains provider-backed (GitHub/other storage), separate from OPFS local drafts.
- Secrets are not stored in OPFS.

- Desktop workbench shell (Tauri) is available under `src/desktop/workbench` and can launch Collector or Configurator from one native window.
- Shared browser/desktop file APIs are centralized in `src/shared/platform` to avoid direct Tauri API calls in app components.

## Workspace

This repository now uses a single `pnpm` workspace rooted at the repo root. Workspace packages stay in their existing directories under `src/apps`, `src/packages`, `src/library`, `src/shared`, and `src/desktop` so the current product layout and relative-import runtime behavior remain unchanged.
