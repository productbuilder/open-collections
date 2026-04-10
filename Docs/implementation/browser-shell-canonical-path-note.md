# Browser Shell Canonical Path

The shell-owned browser path is now the default architecture.

Canonical flow:

- `open-collections-browse-shell` owns source registration intake.
- `src/shared/data/browser-ingestion/` owns fetch, normalization, and ingestion.
- `src/shared/data/browser-runtime/` owns the canonical runtime store.
- `src/shared/data/browser-adapters/` owns list/map projection output.
- `collection-browser` and `timemap-browser` consume shell projections in adapter mode and do not ingest their own manifests.

Legacy code intentionally retained:

- `collection-browser` still supports standalone direct manifest loading outside shell adapter mode because it remains a standalone app entry.
- `timemap-browser` still supports a standalone fixture-backed fallback for map-shell development outside shell adapter mode. This fallback no longer fetches manifests.
- `browse-shell-runtime-state` and projection bridge events remain until the shell stops mounting legacy child apps.

Cleanup completed in this pass:

- Removed the obsolete hardcoded `hilversum-wikimedia` manifest loader from the map surface.
- Removed the obsolete map-side collection-to-feature adapter that duplicated canonical map projection work.
- Removed the extra list bridge `store` alias now that the shell passes the canonical runtime store explicitly.
- Stopped recomputing shell-owned map filter options inside `timemap-browser` when adapter mode is active.

Next recommended step for scale/readiness:

- Replace the legacy child-app bridge with shell-native list/map surfaces so compatibility events can be deleted and projection payloads can stay internal to the shell boundary.
