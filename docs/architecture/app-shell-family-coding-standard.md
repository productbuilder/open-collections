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

Prefer existing shared/library components and primitives before creating app-local UI elements.
If a pattern is reused or expected to be reused across apps, move it into shared/library rather than maintaining near-duplicate local variants.

## UI hierarchy (explicit levels)

Use these levels consistently:

- **Shell**: global app host/chrome/orchestration, app switching/navigation, embedded app container responsibilities.
- **Page**: page-level screen/view inside an app; owns page-level composition.
- **Panel**: grouped section inside a page; reusable mid-level container/functional block.
- **Primitive**: lowest-level reusable building block (for example back button, icon button, card container, section header, row, placeholder state).

## Component-first rule

If a piece of UI has its own lifecycle, state, behavior, configuration, or events, implement it as a component.

Only keep UI as inline markup when it is static, trivial, and truly local to one component.

## Template ownership

Components should own their template.

- Keep markup generation in the component class/module.
- Do not spread core component template ownership across controllers/services.

Place code by hierarchy:

- Shell concerns live in shell-level components.
- Page composition lives in page components.
- Reusable mid-level content blocks become panels.
- Low-level shared building blocks become primitives.
- Avoid collapsing shell/page/panel/primitive layers unless there is a clear, specific reason.

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

## Shell/session lifecycle rule

Within one active `app-shell` session, section switching should behave like SPA navigation, not full app teardown/restart.

- Prefer keeping embedded sub-app instances mounted during normal section switching.
- For intra-session navigation, hide/show section hosts instead of unmounting/remounting sub-app roots by default.
- Preserve in-memory workflow state and live session state unless an explicit reset/reload is requested.
- Keep business logic ownership inside each app; shell lifecycle orchestration must not absorb app domain behavior.

Unmount/remount is still valid for explicit session boundary changes (for example full shell teardown, hard reload, or host-directed reset).

## Desktop scroll behavior rule

For desktop app/work surfaces that act as multi-panel viewing or workflow environments, prefer panel-local or app-local scroll regions over whole-page/document scrolling when that improves stability.

- Keep shell/header/nav chrome visually stable during normal workspace interaction.
- Avoid page-level scrollbar churn that causes header/nav jump or layout shift.
- Keep independent panels usable without forcing one global document scroll position.

This is a preference for data/work surfaces, not a blanket rule for every screen. Use normal page scrolling when the screen is simpler and panel-local scrolling does not improve usability.

## Performance + lazy-loading rule

Performance is a core architectural requirement for this app family, not optional polish.

- Assume large local/remote datasets (many collections, items, files, connected sources).
- Prefer incremental loading over eager full hydration.
- Load and render only what the current view needs; defer non-visible or non-critical work.
- Keep memory bounded across long-running sessions; avoid unbounded retention of list/detail payloads.
- Use local loading states for async surfaces (panel/section-level), not only global blocking states.
- Prefer skeletons or local loading affordances over blank surfaces when that improves continuity.
- Virtualization/windowing is allowed where justified by measured list size/render cost, but avoid heavyweight abstractions before they are needed.

## Browser vs manager interaction intent

`collection-manager` and `collection-browser` are intentionally different surfaces:

- `collection-manager` is workflow/management-first (collections, assignment, editing, metadata, settings).
- `collection-browser` is viewing/discovery-first (items/media/presentation and exploration).

As a result:

- Manager views may keep persistent detail/metadata/editor panels when they support active management workflows.
- Browser views should generally keep metadata/details secondary and reveal them through explicit user action unless a specific browser use case clearly needs always-visible detail.

## Reuse rule

When reuse is needed across apps, prefer extracting/reusing a component (or low-level shared primitive) over duplicating markup logic.

If something is used across multiple apps, it should usually become a shared primitive or shared panel rather than duplicated app-local implementations.
New app-shell family work should prefer composition from shared primitives/panels where practical.

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
