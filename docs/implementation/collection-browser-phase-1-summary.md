# Collection Browser Phase 1 Summary

## Purpose
Document what was completed in the shell-owned canonical browser refactor.

## 1. Summary
Phase 1 established a shell-owned, canonical Collection Browser runtime so list and map now run from the same source of truth instead of parallel, drifting implementations. In practical terms, ingestion, projection, and runtime state handling moved into a shared shell-owned path, while list and map became canonical adapters over that shared data. The result is better cross-surface consistency, clearer ownership boundaries, easier diagnostics, and a cleaner base for future performance and product work.

## 2. Problems Phase 1 addressed
Phase 1 was scoped to remove structural inconsistencies that made browser behavior hard to reason about and expensive to maintain.

Key issues addressed:

- Split ingestion behavior between list and map surfaces, causing data parity and timing drift.
- Hardcoded map manifest path assumptions that bypassed shell orchestration and reduced flexibility.
- Lack of a shared runtime data layer for canonical browser state.
- Duplicated projection and filtering logic across surfaces.
- Inconsistent user-visible behavior between list and map for the same collection data.

## 3. Architecture now in place
Phase 1 leaves the browser in a canonical shell-owned architecture.

### Shell-owned ingestion
The shell now owns ingestion startup and lifecycle decisions. Data intake is coordinated at the shell layer rather than embedded in independent child behaviors.

### Shell-owned canonical runtime store
A canonical runtime store now acts as the source of truth for browser entities, projections, filters, and surface-relevant state.

### Canonical list/map adapters
List and map now operate as adapters over canonical runtime data instead of acting as independent, semi-duplicated runtime owners.

### Single source of truth across surfaces
Both list and map read from the same canonical state path, reducing divergence and making parity expectations explicit.

### Projection caching
Projection caching is now part of the runtime path, reducing repeated projection work and improving responsiveness under repeated filter/sort/view transitions.

### Diagnostics hardening
Diagnostics were improved so runtime behavior, ingestion outcomes, and adapter-level state transitions are more inspectable during debugging and stabilization.

### Cleaned-up canonical path
Legacy and transitional pathways were reduced where safe, clarifying the canonical runtime path and lowering accidental fallback risk.

## 4. Major implementation steps completed
Phase 1 was completed as an incremental sequence rather than a big-bang rewrite.

1. Assessment of current browser/list/map divergence and ownership boundaries.
2. Architecture specification of shell-owned canonical runtime direction.
3. Contract specification to clarify adapter/runtime interfaces.
4. Runtime data layer implementation for canonical browser state.
5. Ingestion service implementation under shell ownership.
6. Shell startup ingestion wiring.
7. List migration to canonical runtime adapters.
8. Map migration to canonical runtime adapters.
9. Diagnostics hardening and observability-focused fixes.
10. Performance and rendering improvements tied to canonical projection/read paths.
11. Cleanup pass to remove obsolete or redundant pathways.
12. Stabilization fixes for regressions discovered during migration and parity checks.

## 5. Notable regressions found and fixed during Phase 1
Several regressions surfaced during the migration and were corrected as part of stabilization:

- List not loading due to the wrong runtime store object being passed into a bridge path.
- Map timeline synchronization error under canonical adapter flow.
- Browse/feed behavior parity loss introduced by transition seams.
- Image flashing on append due to render transition timing.
- List scroll reset when opening item detail.
- Source-card thumbnails missing under specific projection/render flows.
- Sources tab incorrectly scoped to only the last selected source rather than full expected scope.

These fixes materially reduced migration risk and improved confidence in the canonical path.

## 6. Remaining technical debt after Phase 1
Phase 1 intentionally prioritized canonical architecture and parity, so some debt remains:

- The shell still mounts legacy child apps in places where deeper shell-native ownership is desired.
- Bridge/event payloads still function as compatibility seams in parts of the flow.
- There is no browser-level interaction test harness yet for high-confidence cross-surface regression detection.
- List virtualization/windowing is not yet implemented for large DOM-scale scenarios.
- Map clustering/tile strategy is not yet implemented for high-density point scenarios.

## 7. Current recommendation
Phase 1 is complete enough to move into Phase 2 planning. The current architecture is stable enough to shift effort from foundational refactor work toward targeted scalability, reliability, and surface-native improvements.
