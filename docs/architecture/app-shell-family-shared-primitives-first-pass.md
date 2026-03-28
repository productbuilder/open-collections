# App-shell family shared primitives: first pass

This document records the first intentionally small primitive extraction for the app-shell family.

## Primitives extracted

- `open-collections-section-header`
  - Shared low-level heading row with optional leading/actions slots.
- `open-collections-empty-state`
  - Shared low-level empty/placeholder callout with optional title and message.

## Why these were chosen first

- They already repeat in scaffold/newer app-family UI (`app-shell` placeholders, `collection-account`, `collection-presenter`).
- They are primitive-level and stable (simple structure + predictable semantics).
- They improve consistency without introducing app/workflow abstractions.

## Intentionally left out for later

- App-specific connection/provider workflows.
- Manager/browser domain panels.
- Larger page-level compositions and orchestration-heavy components.

## Primitive vs panel vs app-local decision

Use a **shared primitive** when the unit is a small reusable UI building block with minimal domain coupling.

Use a **shared panel** when the unit groups domain behavior/composition reused across screens/apps.

Keep a component **app-local** when behavior is workflow-specific and not yet repeated cross-app.

When uncertain, defer extraction and keep the first pass small.
