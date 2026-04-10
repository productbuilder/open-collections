# Open Collections App Shell

`app-shell` is the shared shell container for Open Collections sub-apps.

## Purpose

The shell owns:

- global navigation
- section-level app mounting
- shared host runtime seams (notifications/capabilities)

## Embedded section mapping

`app-shell` mounts these sub-apps through shared mount adapters:

- **Browse** → `open-collections-browse-shell` (`open-collections-browse-shell`)
- **Collect** → `collection-manager` (`open-collections-manager`)
- **Present** → `collection-presenter` (`open-collections-presenter`)
- **Account** → `collection-account` (`open-collections-account`)

## Runtime direction

Mounting uses the incremental shared contract from:

- `src/shared/runtime/app-mount-contract.js`
- `src/shared/runtime/host-capabilities.js`
- `src/shared/ui/app-runtime/*`

## Notes

- The shell stays lightweight and does not absorb app-specific business workflows.
- Apps still run standalone from their own app URLs.

## Browser Ingestion Ownership

- `open-collections-browse-shell` now owns startup ingestion orchestration for browser sources.
- It creates and owns:
  - canonical runtime store (`src/shared/data/browser-runtime/`)
  - canonical ingestion service (`src/shared/data/browser-ingestion/`)
- Startup ingestion is driven from config registrations mapped from:
  - `src/apps/collection-browser/src/config.js` (`embeddedSourceCatalog`)

The shell-owned canonical path is now the default browser architecture.

### Legacy Bridge Status

- Child list/map apps are still mounted as legacy child apps, but both now receive shell-owned adapter projections.
- The shell emits `browse-shell-runtime-state` as a temporary compatibility bridge with ingestion status/diagnostics summary.
- The shell now also emits `browse-shell-list-projection` for the list child path (`collection-browser`) using the shared list adapter over canonical store state.
- The shell now also emits `browse-shell-map-projection` for the map child path (`timemap-browser`) using the shared map adapter over canonical store state.
- The shell emits `browse-shell-diagnostics` with a consolidated developer-facing diagnostics payload (ingestion summary + runtime store counts + latest list/map projection diagnostics).
- Query contracts (`browse-query-patch` / `browse-query-state`) remain unchanged in this step.

Retained legacy code:

- `collection-browser` standalone manifest loading remains for direct non-shell usage.
- `timemap-browser` standalone fallback remains fixture-backed for shell/layout development, but no longer owns manifest ingestion.

## Diagnostics and Observability

The canonical browser flow now emits `browser-diagnostics-v1` payloads across layers:

- ingestion diagnostics: fetch/normalize counts, warnings/failures, phase timings
- runtime store diagnostics: source/collection/item/included/spatial/temporal counts
- list/map adapter diagnostics: available + filtered totals, projection counts, projection timing, skipped counts
- shell status diagnostics: ingestion status + compatibility + runtime/projection snapshots

### Debugging checklist

To debug "why is this collection/item not showing":

1. inspect `browse-shell-runtime-state` and `browse-shell-diagnostics` to confirm ingestion status and canonical counts
2. inspect `browse-shell-list-projection` or `browse-shell-map-projection` diagnostics for filtered/skipped counts
3. compare runtime store totals vs filtered totals:
   - if runtime has item but projection filtered it out, check query filters/time range/type/tag/viewport constraints
   - if runtime is missing item, inspect ingestion failures/warnings and fetch/normalization diagnostics

### Next Migration Step

- Replace the legacy child-app mounts with shell-native list/map surfaces so the compatibility bridge events can be removed.

## Performance and Cache Strategy

`open-collections-browse-shell` now uses an explicit projection cache layer for list/map payloads.

- Cache key includes:
  - canonical runtime store version (`runtimeStore.getMeta().version`)
  - mode-relevant normalized query fields
  - map viewport fields for map projections
- Cache invalidation:
  - automatic on store version change
  - automatic on relevant query/viewport key changes
- Cache boundaries:
  - in-memory, shell-instance scoped
  - no persistence across reloads
- Recompute discipline:
  - unchanged list key => list projection cache hit
  - unchanged map key => map projection cache hit
  - map key excludes list-only selection state to avoid unnecessary map recompute

Diagnostics:
- `browse-shell-diagnostics` includes:
  - projection cache hit/miss/recompute counts
  - cumulative projection compute timing
  - latest list/map projection diagnostics
