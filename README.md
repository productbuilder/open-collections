# open-collections

Open Collections combines the public website, browser apps, desktop workbench, and shared packages in one repository.

## Repository layout

- Website source: `src/site/`
- Website locale data: `src/site/i18n/`
- Browser apps: `src/apps/`
- Shared packages/runtime: `src/packages/`, `src/shared/`
- Collection content: `src/collections/`
- Integrations: `src/integrations/`
- Desktop/Tauri workbench: `src/desktop/workbench/`

## Publish layout (repository root)

`pnpm site:build` publishes the public static site to the repository root:

- Root entrypoint: `index.html` (redirects to `./site/en/`)
- Localized site: `site/en/...`, `site/nl/...`
- Apps and source/runtime paths are used directly from root (for example `src/apps/...`)

The build does not copy apps/packages/shared/collections into a separate publish folder.

## Commands

```bash
pnpm install
pnpm site:build
pnpm site:preview
```

Other useful commands:

- `pnpm collection-manager:start` -> `/src/apps/collection-manager/`
- `pnpm collection-browser:start` -> `/src/apps/collection-browser/`
- `pnpm configurator:start` -> `/src/apps/configurator/`
- `pnpm bucket-browser:start` -> `/src/apps/bucket-browser/`
- `pnpm desktop:dev`
- `pnpm desktop:build`

## Website workflow

1. Edit source in `src/site/` and `src/site/i18n/`.
2. Run `pnpm site:build`.
3. Verify generated output in `site/en/...` and `site/nl/...` plus root `index.html`.
4. Commit source and generated publish files for deployment.
