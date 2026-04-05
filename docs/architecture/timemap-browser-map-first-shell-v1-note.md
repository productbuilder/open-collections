# Timemap Browser map-first shell v1 note

Date: 2026-04-05
Status: Implementation-oriented v1 guidance

## Why this note

`timemap-browser` currently renders as a scaffold with stacked section panels (filters/map/timeline + side detail), suitable for initial wiring but not for the intended map-first product experience.

This note defines a small, practical shell architecture for the next refactor step: a full-screen map-first UI with overlay chrome, while preserving embedded app-shell compatibility.

## Grounding in current code

Current `timemap-browser` behavior relevant to this refactor:

- `open-collections-timemap-browser-shell` currently renders panel-based scaffold layout, not full-screen overlay composition.
- Map interaction events are already established (`timemap-browser-map-viewport-change`, `timemap-browser-map-feature-click`, `timemap-browser-clear-selection`).
- Selection state already exists (`selectedFeatureId`) and drives detail-card rendering.
- Runtime embedding seam already exists via `data-oc-app-mode`, `data-shell-embed`, and `data-workbench-embed`.

These are good foundations; v1 should keep these event/state seams and only shift composition + shell behavior.

## V1 map-first shell model

### Layout model (single map stage + overlay layers)

Implement the shell as one map stage that fills the component viewport:

- **Base layer**: `oc-map` occupies 100% width/height of the shell viewport.
- **Top overlay layer**: top bar/control strip anchored to top inset.
- **Bottom control layer**: timeline/time-range control anchored to bottom inset.
- **Bottom detail layer**: selection-driven card/panel that opens above the timeline layer.

Use a shell-level overlay stack (absolute positioning + z-index tiers) rather than panel-grid composition.

### Spatial coexistence: timeline + detail panel

Treat timeline as always-primary timemap control and detail as contextual:

- Timeline remains visible by default whenever its chrome is enabled.
- Detail panel opens above timeline (never replacing timeline in v1).
- Detail panel max-height should preserve visible map area and avoid fully covering timeline.
- On narrow/mobile viewports, detail panel should behave like a bottom sheet with snap states (`peek`, `half`, optional `full`), with timeline still pinned at the bottom edge.
- On desktop, detail panel is an anchored bottom card/rail with bounded width and height; timeline remains full-width below it.

## Interaction model

### Selection/open-close behavior

- `timemap-browser-map-feature-click` sets `selectedFeatureId` and opens detail panel.
- Close triggers:
  - explicit close button in detail panel,
  - clear-selection action,
  - optional map-background tap/click behavior (v1 configurable; default off for desktop, on for mobile).
- Closing detail panel clears `selectedFeatureId` (v1 behavior; keep simple and deterministic).

### Timeline/detail coupling

- Timeline updates `timeRange` and triggers spatial refresh via existing controller flow.
- If selection becomes invalid after a time-range change (feature not present), clear selection and close detail panel.
- Do not embed timeline business logic into `oc-map`; keep it in timemap shell/controller.

## Standalone vs embedded support

Support both runtime modes with explicit host configuration attributes/properties.

### Proposed shell configuration API (v1)

On `open-collections-timemap-browser` (or shell element), add explicit toggles:

- `show-top-chrome` (default: `true` standalone, `false` embedded)
- `show-timeline` (default: `true`)
- `show-detail-overlay` (default: `true`)
- `show-filter-entry` (default: `true`)
- `map-edge-to-edge` (default: `true`)
- `embed-density` (`comfortable` | `compact`, default context-dependent)

Runtime mapping:

- If embedded runtime attributes are present, shell applies embedded defaults but still allows explicit override by host.
- Keep current `data-app-presentation-embedded` behavior as the styling/runtime hook.

## Top/bottom chrome that should be hideable/configurable

Configurable in v1:

- Top bar container visibility.
- Filter/menu entry visibility inside top bar.
- Timeline/time-range control visibility.
- Detail overlay visibility.
- Detail panel initial snap mode (mobile).
- Optional map controls visibility (zoom buttons, geolocate, etc.) as pass-through to `oc-map` or shell-owned controls.

This keeps one shell that works in:

- standalone full-screen timemap page,
- app-shell embedded frame where parent chrome may already provide header/actions.

## Reusable shared components vs timemap-specific composition

### Recommendation: shared timeline slider component

**Yes — implement as shared component.**

Reasoning:

- Timeline/time-range control has clear reusable value beyond timemap (for example temporal browse in `collection-browser`).
- It has its own interaction/state/events and should be a component per app-shell guidance.
- Timemap needs it as a first-class control, but ownership should be shared primitive/panel level.

Proposed shared boundary:

- `src/shared/ui/primitives` (if minimal control) or `src/shared/ui/panels` (if includes header + presets + histogram region).
- Suggested element name (example): `oc-time-range-slider`.
- Emit intent events like `oc-time-range-change-requested` with normalized `detail: { start, end, granularity }`.

### Recommendation: shared filters UI component

**Yes — implement as shared component family (incremental).**

Reasoning:

- Filter affordances are expected in multiple app-shell family surfaces.
- We should avoid timemap-local filter UI that later duplicates browser patterns.

Proposed shared boundaries:

- `oc-filter-bar` (compact chips/buttons/entry points for overlay drawers).
- `oc-filter-panel` (expanded controls in a sheet/popover/side panel).
- Timemap shell composes these components and controls open/close placement as overlays.

## Timemap-specific responsibilities (remain local)

Keep in `src/apps/timemap-browser`:

- Map-first shell composition and overlay stacking.
- Spatial relationship rules between timeline/detail/map.
- Selection-to-detail orchestration specific to spatial feature results.
- Timemap mode defaults and runtime-mode presentation mapping.

Keep shared controls generic and business-agnostic.

## Proposed v1 component split

Practical first split for the next refactor:

1. **`open-collections-timemap-browser-shell` (timemap-specific shell/page)**
   - owns map stage + overlay slots
   - owns runtime mode defaults + chrome toggles
   - wires selection/timeline/detail visibility

2. **`oc-time-range-slider` (shared primitive/panel, new)**
   - reusable timeline/time-range UI
   - emits normalized time range intent events

3. **`oc-filter-bar` + later `oc-filter-panel` (shared, new/incremental)**
   - reusable filter entry and expanded filter controls

4. **`timemap-detail-overlay` (timemap-specific panel/component; can start inline then extract)**
   - renders selected spatial feature summary/detail
   - emits close/clear events

This split keeps timemap-specific composition local while investing in reusable controls for `collection-browser` and future apps.

## Implementation sequence (small safe steps)

1. Refactor current scaffold shell to map-first overlay layout while keeping existing controller/state/events unchanged.
2. Add shell chrome configuration attributes + embedded defaults mapping.
3. Extract detail overlay into focused subcomponent if template starts to grow.
4. Introduce shared `oc-time-range-slider` and replace timeline placeholder in shell.
5. Introduce shared filter bar entry component; defer richer filter panel internals to next pass.

This sequence delivers visible v1 UX structure quickly without blocking on complete filter/timeline feature depth.
