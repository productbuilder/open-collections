# Browse-mode shell v1 note (`collection-browser` + `timemap-browser`)

Date: 2026-04-05  
Status: Implementation-oriented v1 guidance

## Why this note

`open-app-shell` currently maps the **Browse** section directly to `timemap-browser`, so map mode effectively becomes the only browse entry in embedded shell usage. We now need a product-level browse mode switch that keeps list browse (`collection-browser`) and map/timeline browse (`timemap-browser`) explicit peers.

This note defines a small v1 architecture that can be implemented incrementally without introducing a large new navigation system.

## Grounding in current repo structure

- `app-shell` owns bottom/primary section navigation and mounts one app per section via `SHELL_SECTION_ADAPTERS`.
- `browse` currently mounts `timemap-browser` directly.
- `timemap-browser` already has standalone + embedded presentation handling and map-first overlay controls.
- `collection-browser` exists as the browse/list app, but current root tag registration conflicts with `timemap-browser` (`timemap-browser` is defined in both app roots), which blocks clean side-by-side embedding.

## v1 recommendation

## 1) Introduce a dedicated browse shell component

**Yes: add a new app-level shell component for browse mode switching.**

Proposed component:

- `open-collections-browse-shell` in a new lightweight app surface (for example `src/apps/browse-shell/`), or colocated under `src/apps/app-shell` as a first incremental step.

Responsibility:

- own `browseMode` state (`list` | `map`)
- render mode switch UI
- mount **exactly one** child browse app at a time:
  - list mode → `collection-browser`
  - map mode → `timemap-browser`
- pass through embedded runtime attributes/config to whichever child app is active

Non-responsibility:

- no domain-level map/timeline logic
- no collection-browser internal browse hierarchy logic
- no shell bottom-nav ownership (stays in `app-shell`)

## 2) Place list/map toggle at browse-shell level

The list/map toggle should live in `open-collections-browse-shell` (page-level browse shell), not in `oc-map`, and not inside `timemap-browser`.

Why:

- the toggle chooses between two sibling browse apps
- it is a browse-surface decision, not a map widget decision
- it avoids `timemap-browser` silently replacing `collection-browser`

## 3) Keep controls split by level

**Browse-shell controls (v1):**

- list/map segmented toggle
- (future) shared search entry + high-level filter entry that should affect both modes
- optional mode-specific label/state summary in shell chrome

**`timemap-browser` controls (stay local):**

- map interaction controls
- timeline/time-range UI
- map feature selection/detail overlay
- map-specific filter affordances

Rule: if a control must behave the same across list and map, it belongs in browse shell; if it is map/timeline-specific, it stays in `timemap-browser`.

## 4) Standalone vs embedded behavior

### Embedded in `app-shell`

- `app-shell` bottom nav remains unchanged (`Browse` tab still one section).
- `browse` section adapter should mount `open-collections-browse-shell` instead of `timemap-browser`.
- browse-shell defaults to `list` mode for continuity (do not surprise existing browse users).
- mode changes happen inside browse-shell only; bottom nav does not get extra tabs for list/map in v1.

### Standalone

- `timemap-browser` remains directly runnable standalone (no regression).
- `collection-browser` remains directly runnable standalone.
- browse-shell can also be exposed as a standalone host page for unified browse entry, but this is optional in v1.

## 5) Future search/filter interaction (v1-safe seam)

Define a small shared browse query contract at browse-shell boundary:

- browse-shell owns canonical `browseQuery` (search text, shared filters, sort where applicable)
- browse-shell passes query to active child app via attributes/properties/events
- each child app maps canonical query to its local controller/state

For v1 implementation, this can start with only:

- `mode`
- placeholder search/filter event plumbing

Then incrementally expand without changing the shell boundary.

## 6) Avoid breaking current `collection-browser` experience

Guardrails for v1:

1. Default browse mode to `list` in browse-shell.
2. Keep collection-browser standalone entry unchanged.
3. Keep existing collection-browser internal view modes (`all/sources/collections/items`) unchanged.
4. Do not move collection-browser business logic into browse-shell.
5. Preserve runtime embedded signals already used by both apps.

## 7) Implementation plan (small, direct next step)

1. **Resolve custom-element root naming collision** between `collection-browser` and `timemap-browser` so both can coexist safely.
2. Create `open-collections-browse-shell` with local `browseMode` state + segmented switch UI.
3. Add simple child mount logic (list vs map), with passthrough of embedded/runtime presentation attributes.
4. Update `app-shell` browse section adapter to mount browse-shell.
5. Keep mode default = list; add optional host override (e.g., `default-browse-mode="map"`).
6. Add minimal docs + manual verification for:
   - embedded shell browse mode switching
   - standalone timemap unchanged
   - standalone collection-browser unchanged

## v1 API sketch (implementation hint)

On `<open-collections-browse-shell>`:

- `default-browse-mode="list|map"` (default `list`)
- `browse-mode="list|map"` (controlled mode optional)
- emits `browse-shell-mode-change` with `{ mode }`

Child mapping inside browse-shell:

- `list` → `<collection-browser ...runtime attrs...>` (or canonical browser tag name)
- `map` → `<timemap-browser ...runtime attrs...>`

## Decision summary

For v1, implement a **small browse shell component** that owns only list/map mode switching and shared browse-level chrome, while keeping existing app boundaries intact:

- shell-level app switching stays in `app-shell`
- browse-mode switching lives in browse-shell
- map/timeline internals stay in `timemap-browser`
- list/discovery internals stay in `collection-browser`

This provides a clear product-level list/map switch without replacing or obscuring the current collection-browser experience.
