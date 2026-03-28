# App-shell family shared panels (first pass)

## What was extracted now

A small shared panel layer was added under `src/shared/ui/panels`:

- `open-collections-section-panel`
  - reusable panel-level section container
  - composes `open-collections-section-header`
  - provides `leading` and `actions` header slots plus body content slot
- `open-collections-empty-state-panel`
  - reusable panel-level scaffold/placeholder panel
  - composes `open-collections-section-panel` + `open-collections-empty-state`

## Why these panels were chosen first

These structures are already repeated (or directly adjacent) across app-shell family work:

- header + grouped section body content
- header + placeholder/empty-state panel content

They are stable and cross-app without embedding app-specific workflow logic.

## Primitive composition used

Both shared panels are built from the first-pass shared primitives:

- `open-collections-section-header`
- `open-collections-empty-state`

No new duplicate low-level primitives were introduced.

## Initial adoption in this step

- `collection-presenter`
  - presenter scaffold cards now use `open-collections-empty-state-panel`
- `collection-account`
  - connections area now uses `open-collections-section-panel`
  - settings area now uses `open-collections-empty-state-panel`
- `app-shell`
  - shell mount placeholders now use `open-collections-empty-state-panel`

## Intentionally left app-local for now

Kept local pending further stabilization/reuse proof:

- connection-provider setup and repair flows
- manager/browser workflow-heavy panels
- app/page orchestration wrappers tied to business state

## Decision rule: page vs panel vs primitive

- **Page**: owns whole-screen composition for an app route/screen.
- **Panel**: grouped reusable section inside a page, often combining multiple primitives.
- **Primitive**: lowest-level visual building block with minimal composition responsibility.

When uncertain, keep workflow-heavy structures app-local and extract only stable repeated panel composition.
