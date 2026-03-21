# Site i18n convention

This site now uses a simple build-time i18n flow for locale-prefixed static output.

## Source of truth

- Shared strings and initial translated page content live in `src/i18n/en.json` and `src/i18n/nl.json`.
- English (`en`) is the source/default locale.
- Dutch (`nl`) is the second supported locale.

## Build output

The repository now uses `notes/` for internal/source markdown notes and `docs/` for the generated GitHub Pages publish directory.


Run:

```bash
pnpm site:build
```

This generates localized output in `docs/`:

- `docs/site/en/...`
- `docs/site/nl/...`
- standalone app assets under `docs/apps/...`
- shared package/runtime modules under `docs/packages/...` and `docs/shared/...`
- collection content under `docs/collections/...`
- referenced markdown notes/resources under `docs/notes/...`

The root `docs/index.html` redirects to `./site/en/`. Binary installer files are excluded from the build output and should be published through an external release channel such as GitHub Releases. GitHub Pages should publish from the repository `docs/` folder on the main branch.

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
2. Add page-specific content under `pages` in `src/i18n/en.json` and `src/i18n/nl.json`.
3. Add a page entry under a route-based page id such as `home`, `get-started`, `docs`, or `docs/open-collections-protocol`.
4. Add a renderer definition to `TRANSLATED_PAGE_DEFINITIONS` in `scripts/build-site.mjs` and return localized HTML for the `<main>` content.
5. Run `pnpm site:build` and confirm the page exists in both `docs/site/en/...` and `docs/site/nl/...`, with referenced repository notes copied into `docs/notes/...`.

## How untranslated pages are handled

- Every known site page is emitted for every locale.
- If a locale-specific page body is not implemented yet, the generator keeps the English body content for that locale.
- Shared shell/navigation text still uses the locale dictionary.
- The language switcher still links to the same route in the other locale.

## Shared shell data flow

At build time each page receives a small `window.OPEN_COLLECTIONS_SITE` context that includes:

- current locale
- normalized page metadata (`page.id`, `page.route`, `page.activeSection`)
- same-page alternate locale URLs
- locale i18n data for the shared shell and docs nav

`src/site/shared/site-shell-components.js` and `src/site/docs/docs-nav.js` read from that injected context, so runtime logic stays lightweight and the localized output remains plain static HTML. The build also validates that every translated page id exists in every locale file and that docs navigation keeps the same href structure across locales.

## Build validation

The site build now performs a lightweight internal-link validation pass across generated HTML in `docs/`.

- It checks relative `href`, `src`, and `action` targets emitted into the built site.
- It ignores external URLs, in-page hashes, and `/api/...` endpoints.
- The build fails if a generated page points at a missing internal target.
