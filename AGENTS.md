# Contributor + Codex guidance

## Purpose

Use this guide when implementing or updating UI in the app-shell family.

See also: `docs/architecture/app-shell-family-coding-standard.md` for the fuller coding standard.

## Scope

Primary targets:

- `src/apps/app-shell`
- `src/apps/collection-manager`
- `src/apps/collection-browser`
- `src/apps/collection-account`
- `src/apps/collection-presenter`
- related shared UI/foundation work in `src/shared`

## Default UI direction

- Preferred UI model: plain Web Components.
- Meaningful UI units should usually be components.
- App roots, pages/screens, and reusable interactive blocks should generally be components.
- Prefer existing shared/library components and primitives before introducing app-local UI elements.
- If a pattern is reused (or likely to be), move it to shared/library instead of duplicating variants across apps.

## UI hierarchy (use consistently)

- **Shell**: global host/chrome/orchestration, app switching/navigation, embedded app container responsibilities.
- **Page**: page-level screen/view inside an app; owns page composition.
- **Panel**: grouped section within a page; reusable mid-level container/functional block.
- **Primitive**: lowest-level reusable building block (for example back button, icon button, card container, section header, row, placeholder state).

## Component ownership

- Components should own their template and local styling.
- Shadow DOM is the default for app-shell family UI.
- Public API should be explicit through attributes, properties, and events.
- Use `CustomEvent` for outward UI communication by default.

## Helper/function rule

- Small HTML-string render helpers are allowed only as subordinate helpers inside a component.
- Avoid helper-led composition that replaces a meaningful component.

## Controllers/services/runtime rule

Controllers, services, and shared runtime should mainly own non-visual concerns:

- orchestration
- persistence
- integration
- runtime capability wiring

Keep rendering ownership with components.

## Placement rule

- Put shell concerns in shell-level components.
- Put page composition in page components.
- Put reusable mid-level content blocks in panels.
- Put low-level reusable building blocks in shared primitives.
- Avoid collapsing shell/page/panel/primitive layers without clear need.

## Practical decision rule

Make it a component when any of the following are true:

- it has its own state or lifecycle
- it has user interaction or emits events
- it needs reuse across screens/apps
- it has configurable inputs or host-facing API

If none are true and markup is tiny/local, an internal helper is acceptable.

## Practical reuse rule

- If UI is used across multiple apps, it should usually become a shared primitive or shared panel, not duplicated local implementations.
- New app-shell family code should prefer composing from shared primitives/panels where practical.

## Migration approach

Use incremental migration.

- New UI work should follow the component-first direction.
- When touching older mixed-pattern areas, move them toward this model in small safe steps.
- Do not require big-bang rewrites.
