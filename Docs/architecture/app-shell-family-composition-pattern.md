# App-shell family composition pattern (refinement)

## Purpose

This document adds a modest composition-pattern refinement for app-shell family apps.

It does not replace the existing coding standard. It clarifies when light DOM is a practical fit for app-level composition-heavy views while keeping Shadow DOM as the default for reusable components.

See also:

- `docs/architecture/app-shell-family-coding-standard.md`
- `docs/architecture/collection-browser-browse-hierarchy-plan.md`

## Status

- Web Components remain the primary UI model.
- Component-first direction remains in place.
- This is an incremental refinement, not a rewrite.

## Core model

### 1) App-level unique views may use light DOM

Unique app view/shell layers (for example Browser / Manager / Presenter / Account top-level view composition) may use light DOM when they are primarily composing other components and coordinating layout/state flow.

These view layers should:

- focus on composition/orchestration/layout
- stay modest and readable
- avoid turning into giant monolithic renderers

### 2) Reusable/shared components stay Shadow DOM by default

Shadow DOM remains the default for reusable units, including:

- shared primitives
- shared panels
- reusable library components
- self-contained interaction components

These should keep explicit, component-owned template/styling and clear public APIs.

### 3) Prefer slot-based composition when it improves clarity

Layout/container components should expose slots where practical, and child components should be composed into those slots.

Benefits:

- clearer separation of layout vs content rendering
- better one-responsibility boundaries per component
- lower template coupling between reusable layout and app-specific content

### 4) One-thing-per-component practical rule

Prefer this split:

- view/page components compose
- layout components lay out
- card/content components render content
- controllers/services/runtime own non-visual orchestration

## Relationship to existing standards

This refinement preserves current architecture commitments:

- plain Web Components as primary model
- explicit attributes/properties/events APIs
- shared/library-first reuse
- incremental migration

It should not be interpreted as "abandon Shadow DOM."

Instead:

- Shadow DOM by default for reusable/shared components
- light DOM acceptable (and often preferable) for unique composition-heavy app views when justified

## Relevance to current app-shell family apps

Likely future fit:

- `collection-browser`
- `collection-manager`
- `collection-presenter`
- `collection-account`

For these apps, app-level view shells may compose shared components in light DOM where that improves composition clarity, while shared reusable library components remain Shadow DOM.

## Migration guidance

Use incremental adoption:

1. apply only when touching relevant app-level composition layers
2. keep reusable shared units Shadow DOM-first
3. avoid broad mechanical refactors for architecture purity
4. prioritize clear boundaries and behavior stability over pattern churn
