# Shared App Foundation

This folder provides a small, incremental UI foundation for app-level layout and styling.

## What is included

- `tokens.css.js` – shared semantic CSS tokens for spacing, radius, borders, text, surfaces, and app-level sizing.
- `layout.css.js` – reusable app/page primitives:
  - `.oc-app-frame`
  - `.oc-app-bar`
  - `.oc-app-nav`
  - `.oc-app-viewport`
  - `.oc-page`
  - `.oc-page-intro`
  - `.oc-surface`
  - `.oc-empty-state`
- `placeholders.js` – tiny helper for rendering section placeholder states in scaffold apps.

## Intended usage

Use these primitives for app framing and section/page containers in newer or actively changing apps (currently `app-shell` and `collection-account`; planned `collection-presenter`).

## What remains app-specific

- Domain/business UI (forms, editors, viewer controls, provider-specific workflows)
- Complex app-local component structure and behavior
- Existing `collection-manager` and `collection-browser` internals for now

## Migration note

This is intentionally conservative. It provides a common baseline so `collection-manager` and `collection-browser` can adopt shared tokens/layout classes gradually, without risky broad rewrites.


## Related runtime primitives

For cross-app runtime states (loader/empty/error/success) and host toast feedback, use `src/shared/ui/app-runtime/*`.
