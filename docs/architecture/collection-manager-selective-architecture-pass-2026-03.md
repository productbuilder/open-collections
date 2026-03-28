# Collection-manager selective architecture pass (2026-03)

## What this pass addressed

This pass made a targeted, low-risk alignment of `collection-manager` with the app-shell-family hierarchy and shared UI direction, without changing manager workflow ownership.

Primary changes:

- reduced manager-local shell-like naming/composition in the top-level viewport container
- adopted shared panel/primitive composition for manager onboarding and placeholder states
- kept manager workflow-heavy orchestration and connection fallback behavior unchanged

## Structure issues addressed

- Replaced manager root wrapper naming from generic shell framing to explicit manager page/root framing (`manager-root`) to better reflect shell-vs-app responsibility boundaries.
- Reduced ad hoc local empty-state composition in manager browser onboarding by composing from shared UI layers instead.
- Replaced register-dialog placeholder block markup with shared panel + empty-state composition.

## Shared layers adopted in manager

- `open-collections-section-panel`
  - now composes the manager onboarding section block
- `open-collections-empty-state`
  - now provides manager onboarding callout content
- `open-collections-empty-state-panel`
  - now provides register-dialog placeholder structure

## Intentionally left manager-local (for safety)

- Manager workflow orchestration (workspace/collection/item state transitions and publish/readiness coupling)
- Manager-specific browser workflow interactions (selection, file-drop handling, add-item/add-collection actions)
- Manager connection dialog fallback and account-handoff compatibility seam
- Manager-specific mobile flow and pane orchestration behavior

These areas are still workflow-heavy and tightly coupled to manager operational behavior, so keeping them local is the safer incremental path.

## Safest next cleanup step

Extract the remaining manager-local `open-panel-shell` title/toolbar chrome into shared panel primitives only where behavior is purely presentational, while keeping all manager controller/runtime workflows unchanged.

That would further clarify Page vs Panel boundaries in manager without introducing a risky rewrite.
