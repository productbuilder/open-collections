# Site i18n convention

This site now uses a simple build-time i18n flow for locale-prefixed static output.

## Source of truth

- Shared strings and initial translated page content live in `i18n/en.json` and `i18n/nl.json`.
- English (`en`) is the source/default locale.
- Dutch (`nl`) is the second supported locale.

## Build output

Run:

```bash
pnpm site:build
```

This generates localized output in `site-dist/`:

- `site-dist/en/...`
- `site-dist/nl/...`

The root `site-dist/index.html` redirects to `./en/`.

## What is localized now

This first pass localizes:

- the shared site shell (`header`, `footer`, language switcher)
- the shared docs navigation labels
- the home page
- the get-started page
- the docs index page

Other pages are still emitted for both locales. Until they are translated, the Dutch output reuses the English page body and shows a translation-in-progress notice.

## How to add a new translated page

1. Add or update the shared strings in both locale dictionaries if needed.
2. Add page-specific content under `pages` in `i18n/en.json` and `i18n/nl.json`.
3. Add the page key to `TRANSLATED_PAGE_KEYS` in `scripts/build-site.mjs`.
4. Add a renderer for that page in `scripts/build-site.mjs` and return localized HTML for the `<main>` content.
5. Run `pnpm site:build` and confirm the page exists in both `site-dist/en/...` and `site-dist/nl/...`.

## How untranslated pages are handled

- Every known site page is emitted for every locale.
- If a locale-specific page body is not implemented yet, the generator keeps the English body content for that locale.
- Shared shell/navigation text still uses the locale dictionary.
- The language switcher still links to the same route in the other locale.

## Shared shell data flow

At build time each page receives a small `window.OPEN_COLLECTIONS_SITE` context that includes:

- current locale
- route/page key
- same-page alternate locale URLs
- locale translations for shared shell and docs nav

`site/shared/site-shell-components.js` and `site/docs/docs-nav.js` read from that injected context, so runtime logic stays lightweight and the localized output remains plain static HTML.
