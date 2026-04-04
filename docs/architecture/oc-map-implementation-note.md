# `oc-map` implementation note (analysis-only)

Date: 2026-04-04

This note is grounded in current repo structure and existing app-shell family conventions.

## Observed patterns in this repo

### 1) Shared components in `src/shared`

- Shared UI is split into layered packages:
  - `src/shared/ui/primitives` for low-level reusable blocks (for example section headers, action rows, cards).
  - `src/shared/ui/panels` for mid-level grouped UI composition.
  - `src/shared/ui/app-foundation` for tokens/layout/base-element.
- Most shared Web Components self-register in-module via guarded `customElements.define(...)` blocks.
- Shared folders expose barrel `index.js` files that both import (for side-effect registration) and export classes.

### 2) Web Components structure

- Shadow DOM is the default.
- There are two recurring base patterns:
  - `BaseElement` (`src/shared/ui/app-foundation/base-element.js`) with a render lifecycle (`renderStyles()`, `renderTemplate()`, `afterRender()`) and attribute-driven rerendering.
  - Plain `HTMLElement` subclasses for legacy/incremental areas.
- Components typically:
  - declare `observedAttributes`,
  - sync state from attributes/properties,
  - render to `shadowRoot.innerHTML`,
  - emit `CustomEvent` with `bubbles: true` and `composed: true` for host communication.

### 3) Styling conventions

- Shared token-first styling is established via `appFoundationTokenStyles` (`--oc-*` tokens).
- Newer shared components include token styles in component-local style strings and keep styles colocated with component modules.
- In app-shell family areas, style modules commonly use `*.css.js` exports.
- `collection-manager` includes a guardrail script (`scripts/check-css-tokens.mjs`) that discourages introducing raw theme hex/radius values outside token files.

### 4) App bootstrapping in `src/apps`

- Standalone app entry pattern:
  - `index.html` mounts one root custom element,
  - module script loads `src/index.js`,
  - `src/main.js` usually just imports `./index.js`.
- `src/index.js` commonly imports shared primitives/panels plus app root module, where custom element definition happens.
- Embedded app-shell pattern:
  - `app-shell` uses `createWebComponentAppAdapter(...)` and `SHELL_SECTION_ADAPTERS` to mount child app custom elements and map runtime attributes.
  - Runtime mode is communicated with attributes/data attributes (`data-oc-app-mode`, `data-shell-embed`, `data-workbench-embed`).

### 5) Existing map-related utilities/conventions

- No reusable map rendering primitive/component currently exists in `src/shared/ui`.
- No existing Leaflet/Mapbox/OpenLayers utility layer was found under shared UI/app-shell-family scope.
- Existing `map*` usage in shared runtime is configuration mapping (`mapConfigToAttributes`) for embedded mount attributes, not geospatial/map rendering.
- `timemap-*` names (for example `timemap-browser`) appear to be legacy app tag naming, not a shared map widget convention.

## Recommendation for `oc-map`

### Where `oc-map` should live

- Place `oc-map` under `src/shared/ui/primitives/oc-map.js`.
- Reason: map view is a reusable visual building block likely needed across multiple apps; this matches the primitive tier.

### How it should be registered

- Follow existing shared primitive pattern:
  - self-register in module with guarded define:
    - `if (!customElements.get("oc-map")) customElements.define("oc-map", OcMapElement);`
- Add it to `src/shared/ui/primitives/index.js` for side-effect import and class export.

### How styles should be handled

- Keep styles component-owned in `oc-map.js` (or adjacent `oc-map.css.js` if large).
- Prefer tokenized styling (`--oc-*`) and include `appFoundationTokenStyles` in component styles.
- Avoid new global stylesheet coupling.

### Shared component API/events guidance for `oc-map`

- Expose explicit host API via attributes/properties for declarative + runtime control, for example:
  - center/zoom/bounds/layers/data source
  - interaction flags (drag/zoom/controls)
  - mode/state (loading/error)
- Emit intent events as `CustomEvent` (`bubbles: true`, `composed: true`) for outward communication, for example:
  - `oc-map-ready`
  - `oc-map-view-change`
  - `oc-map-feature-activate`
  - `oc-map-error`
- Keep event payloads minimal and semantic (avoid leaking internal map library instance details).

### Helper/base class guidance

- Prefer extending `BaseElement` for new shared primitive work:
  - consistent lifecycle and attribute rerender pattern,
  - consistent hidden handling and helper getters.
- If `oc-map` needs heavy imperative integration with a third-party map engine, it can still use `BaseElement` while keeping imperative bridge logic in `onFirstConnected()`/`afterRender()`/`onDisconnected()`.
- Use small internal render helpers only where subordinate to the component; do not move map UI composition into controller-led helper modules.

## Suggested next step (when implementation begins)

- Start with a minimal primitive shell (`oc-map`) and stable API/event contract first.
- Add optional app-specific wrappers/panels in app-local code only if a workflow requires it.
- If map usage repeats with domain composition patterns, promote that layer later to a shared panel.
