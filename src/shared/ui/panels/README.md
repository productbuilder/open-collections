# Shared UI panels (first pass)

This folder holds the first small shared panel layer for the app-shell family.

## Included now

- `open-collections-section-panel`
  - Mid-level section panel that composes:
    - `open-collections-section-header`
    - panel body content via default slot
  - Supports optional `leading` and `actions` header slots.
- `open-collections-empty-state-panel`
  - Mid-level section panel for scaffold/placeholder states that composes:
    - `open-collections-section-panel`
    - `open-collections-empty-state`
- `open-collections-panel-chrome`
  - Mid-level presentational panel chrome for title/subtitle/status + toolbar + content.
  - Emits `panel-back` when optional back button is enabled (`show-back="true"`).

## Why these first

These panel structures already repeat in app-shell-family code as:

- section heading + grouped body content
- section heading + empty-state placeholder content

They are stable enough for immediate reuse in `app-shell`, `collection-account`, and `collection-presenter` without pulling app-specific workflow behavior into shared code.

## Intentionally left local for now

- Connection workflow panels (provider setup, repair, credential flows)
- Manager/browser workflow-heavy panels
- App-specific page orchestration and business state

## Primitive vs panel guidance

- Use a **primitive** for low-level building blocks (header row, empty callout).
- Use a **panel** for grouped section composition that remains reusable across apps.
- Keep app-specific workflows local until reuse is concrete.
