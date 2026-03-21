# Site i18n convention

Locale content is authored in:

- `src/i18n/en.json`
- `src/i18n/nl.json`

English (`en`) is the source/default locale.

## Build output

Run:

```bash
pnpm site:build
```

This generates:

- `index.html` at repository root (redirect to `./site/en/`)
- localized pages in `site/en/...` and `site/nl/...`

The site links to root-published resources directly (for example `src/apps/...`) instead of copying those trees into a separate publish directory.

## Localized pages

Current translated page definitions are implemented in `scripts/build-site.mjs` via `TRANSLATED_PAGE_DEFINITIONS`.

If a page is not explicitly translated yet, the build emits a localized shell and reuses the fallback body.

## Validation

`pnpm site:build` validates internal links across the generated localized site plus root `index.html`.
