# App-shell family minimal base component note

## Context and assessment

This step evaluated whether app-shell family components need a shared base layer, while keeping plain Web Components as the primary model.

Observed current patterns across `app-shell`, `collection-browser`, `collection-account`, `collection-presenter`, and shared UI modules:

- repeated `attachShadow({ mode: "open" })` setup in most component constructors
- repeated split between style string + template string rendering into `shadowRoot.innerHTML`
- repeated first-connect lifecycle flow (`render()`, then `bindEvents()`, then `apply state`)
- existing reusable panel/primitive direction already exists (`open-panel-shell`, `open-pane-layout`, shared back button/icons/tokens)

Conclusion: the smallest useful shared layer is a tiny base element that standardizes shadow/render lifecycle, while keeping component APIs explicit and native.

## PB-style concepts considered

Concepts adopted (minimal subset):

- base class for shared shadow DOM + render lifecycle plumbing
- explicit overridable methods for styles and template output
- explicit lifecycle hooks (`onFirstConnected`, `onConnected`) without hidden runtime registration

Concepts intentionally not adopted:

- framework-like state system, decorators, or reactive proxy/magic binding
- deep inheritance tree (`BasePage`, `BasePanel`, etc.) before repetition clearly requires it
- automatic event wiring abstraction
- centralized rendering engine replacing native custom element behavior

Notes on cross-repo references:

- attempted to inspect `productbuilder/pb-frt-cat-core` and `productbuilder/pb-org-moooicarpets` directly from this environment, but remote access was unavailable (network 403 from this runner).
- this implementation therefore uses only repo-local evidence plus the requested PB-style direction at concept level.

## What was added

- `src/shared/ui/app-foundation/base-element.js`:
  - small `BaseElement extends HTMLElement`
  - default shadow root setup
  - standard render path (`renderStyles()` + `renderTemplate()`)
  - lightweight lifecycle hooks for first connect / subsequent connects / disconnect / attribute changes

This stays intentionally narrow: it removes repetitive boilerplate but does not create a custom framework.

## Initial proof of direction

Applied incrementally to two components only:

- `src/apps/collection-presenter/src/app.js`
- `src/apps/collection-browser/src/components/browser-metadata-panel.js`

Both remain plain custom elements with explicit methods and events.

## Guidance going forward

1. Prefer extracting shared primitives/panels first when the repeated concern is visual structure (header rows, section containers, panel wrappers, empty states).
2. Use `BaseElement` only for repeated component plumbing (shadow + style/template lifecycle).
3. Add `BasePage` or `BasePanel` only after concrete duplication is demonstrated in at least 2–3 real components.
4. Keep public APIs explicit via attributes/properties/events (`CustomEvent` for outward communication).
