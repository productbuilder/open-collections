# App-shell family coding standard

## Scope

This standard applies to UI implementation work in:

- `src/apps/app-shell`
- `src/apps/collection-manager`
- `src/apps/collection-browser`
- `src/apps/collection-account`
- `src/apps/collection-presenter`
- related shared UI/foundation work under `src/shared`

Use this as the default for new work and for incremental updates to existing code.

## Primary UI model: plain Web Components

Default to plain Web Components for meaningful UI units.

Use custom elements for:

- app roots
- page/screen containers
- reusable interactive UI blocks

Avoid introducing new top-level UI patterns that compete with component-based architecture.

## Component-first rule

If a piece of UI has its own lifecycle, state, behavior, configuration, or events, implement it as a component.

Only keep UI as inline markup when it is static, trivial, and truly local to one component.

## Template ownership

Components should own their template.

- Keep markup generation in the component class/module.
- Do not spread core component template ownership across controllers/services.

## Styling rule

Prefer component-owned styling.

- Keep style definitions with the component (or in adjacent component-focused modules).
- Avoid broad global style coupling for app-shell family UI concerns.

## Shadow DOM default

Use Shadow DOM by default for app-shell family components.

Use light DOM only when there is a clear requirement (for example host-level slot/layout integration that cannot be handled cleanly in shadow DOM).

## Public component API

Treat attributes, properties, and events as the component public API.

- Attributes: declarative configuration and host integration.
- Properties: structured/runtime inputs.
- Events: outward communication.

Document and keep APIs stable for cross-app usage.

## Event naming

Use `CustomEvent` as the default communication mechanism.

Event names should be explicit, lower-case, and scoped by feature intent (for example `account:save-requested`, `shell:navigate`).

Prefer intent-oriented events over leaking internal implementation details.

## State ownership

UI state that drives rendering should live in the component.

Controllers/services/runtime layers should primarily own:

- orchestration
- persistence
- data access/integration
- cross-cutting runtime behavior

Do not move visual rendering ownership to controllers/services.

## Render helper rule

HTML-string render helpers are allowed only as small internal helpers subordinate to a component.

Allowed:

- small repetitive fragments
- formatting helpers used by one component

Avoid:

- helper-led page composition
- helper modules acting as de facto component replacements

## Shared foundation rule

`src/shared` foundation modules should stay low-level and reusable.

They should provide primitives/tokens/contracts that components consume, not app-specific visual composition.

## Standalone vs embedded rule

Design app-shell family components so apps can run in both:

- standalone mode
- embedded mode inside `app-shell`

Keep host/runtime seams explicit and avoid hard-coding one host context.

## Reuse rule

When reuse is needed across apps, prefer extracting/reusing a component (or low-level shared primitive) over duplicating markup logic.

## Migration guidance

This standard is incremental.

- Apply component-first rules to all new UI work.
- When touching legacy mixed-pattern areas, improve toward this standard in small safe steps.
- Do not block delivery on big-bang rewrites.

## Default-to-component-first summary

When deciding how to build UI in the app-shell family:

1. Start with a Web Component.
2. Keep template + style + UI state with that component.
3. Expose attributes/properties/events as the API.
4. Use small render helpers only as internal implementation details.
5. Keep controllers/services focused on non-visual orchestration/runtime logic.

For contributor operational guidance, see repo-level `AGENTS.md`.
