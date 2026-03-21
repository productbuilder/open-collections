# open-collections

Open Collections combines the public website with the main application work for the project, including the browser-based apps, the desktop/Tauri workbench, and supporting packages. The repository contains both source files and the built GitHub Pages publish output.

## Repository overview

- Public website source: `site/`, `i18n/`, and `scripts/build-site.mjs`
- GitHub Pages publish output: `docs/`
- Browser-based apps: `src/apps/`
- Desktop/Tauri shell: `src/desktop/workbench/`
- Shared libraries and packages: `src/library/`, `src/packages/`, `src/shared/`

## Website structure

The website now uses a build-based publishing flow.

- Source site content lives in the source tree, mainly under `site/` and `i18n/`.
- `scripts/build-site.mjs` builds the publishable static site into `docs/`.
- GitHub Pages is configured to publish from the `main` branch and the `/docs` folder.
- `docs/index.html` is the GitHub Pages entrypoint and redirects into the localized site.
- Public localized pages are published under locale-prefixed paths such as `docs/en/...` and `docs/nl/...`.
- The repository root `index.html` still exists in source, but it is **not** the GitHub Pages entrypoint anymore.

## Site commands

Install dependencies once from the repository root:

```bash
pnpm install
```

Main site commands:

- `pnpm site:build` — builds the localized static site into `docs/` for GitHub Pages publishing.
- `pnpm site:preview` — serves the built `docs/` output locally so you can review what GitHub Pages will publish.

## GitHub Pages publishing workflow

Practical workflow for website changes:

1. Edit the website source files in `site/`, `i18n/`, or related scripts.
2. Run `pnpm site:build`.
3. Review the generated output in `docs/`.
4. Commit both the source changes and the updated built files in `docs/`.
5. Push to `main`.
6. GitHub Pages publishes from `main` → `/docs`.

In other words: if you want a website change to go live, rebuild `docs/` before you commit and publish.

## Desktop / Tauri workflow

The repository also contains the Open Collections desktop workbench in `src/desktop/workbench/`. It stages frontend files into a desktop `dist/` directory and then runs the Tauri shell around that staged frontend.

Main desktop commands:

- `pnpm desktop:stage` — copies the current frontend source into the workbench desktop staging directory.
- `pnpm desktop:dev` — stages the frontend and launches the Tauri desktop app in development mode.
- `pnpm desktop:build` — builds the desktop app distributables through Tauri.
- `pnpm desktop:info` — prints Tauri environment and toolchain information.

## Other useful app commands

These commands are helpful when you want a quick pointer for which browser app to open while serving the repository locally:

- `pnpm manager:start` — points you to the manager app at `src/apps/manager/`.
- `pnpm browser:start` — points you to the browser app at `src/apps/browser/`.
- `pnpm configurator:start` — points you to the configurator app at `src/apps/configurator/`.
- `pnpm bucket-browser:start` — points you to the bucket browser app at `src/apps/bucket-browser/`.

If you want to run those browser-based apps directly, serve the repository root as static files and open the relevant path in your browser.

## Built output notes

- `docs/` is generated publish output for the public website.
- Changes intended for the live site should usually include a fresh `pnpm site:build` so `docs/` stays in sync with the source.
- Avoid treating `docs/` as hand-edited source unless there is a very specific reason.

## Practical edit/build/publish summary

- Website work: edit source in `site/` and `i18n/`, build with `pnpm site:build`, review with `pnpm site:preview`, then commit source plus `docs/`.
- Desktop work: use the `desktop:*` commands to stage, run, inspect, or build the Tauri workbench.
- App work: use the `manager:start`, `browser:start`, `configurator:start`, and `bucket-browser:start` helpers as quick entry points when serving the repo locally.
