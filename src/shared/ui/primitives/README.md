# Shared UI primitives (first pass)

This folder holds the first modest set of app-shell family shared primitives.

## Included now

- `open-collections-section-header`
  - Low-level section/page heading row with optional leading/actions slots.
- `open-collections-empty-state`
  - Low-level empty/placeholder callout with optional title and message.
- `open-collections-action-row`
  - Reusable full-width navigation/action row with leading icon, title/subtitle, optional trailing arrow, and optional secondary trailing slot control.
- `open-collections-preview-summary-card`
  - Reusable whole-card action surface with title/subtitle, thumbnail preview strip, and summary count label for browse/discovery cards.

## Why these first

These patterns already repeat across `app-shell`, `collection-account`, and `collection-presenter`, and are simple enough to standardize without pulling app-specific workflow logic into shared code.

## Intentionally left for later

- App/domain panels (`connections-list`, provider setup flows, manager/browser workflows)
- Larger page compositions
- Speculative abstractions that are not yet stable across apps

## Primitive vs panel guidance

Use a **primitive** when the unit is a small, reusable visual building block.
Use a **panel** when the unit owns grouped domain behavior/composition.
Keep app-specific workflows local until repeated cross-app usage is clear.
