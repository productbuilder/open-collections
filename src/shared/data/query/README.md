# Shared browse query contract (v1)

This folder defines a first shared query/filter contract for browse-style apps.

## Purpose

Provide one practical shape that can be used by:

- `collection-browser` (cards/results browsing)
- `timemap-browser` (filters + timeline/map state)
- future shared loading adapters (including spatial loading)

## Contract fields

`collection-query-contract.js` models shared semantics discovered in current app code:

- `text`: free text query input
- `keywords`: keyword terms (already present in `timemap-browser` scaffold)
- `tags`: tag filters (already present in `timemap-browser` scaffold)
- `types`: media/item types (already present in `timemap-browser` scaffold)
- `categories`: optional category filters for future browse/map usage
- `sourceIds`: selected source scope (aligns with `collection-browser` source navigation)
- `collectionManifestUrls`: selected collection scope (aligns with `collection-browser` manifest selection)
- `timeRange.start` / `timeRange.end`: time window bounds
- `selection`: optional shared selection pointers (`sourceId`, `collectionManifestUrl`, `itemId`, `featureId`)

## Intended usage notes

- Apps can keep their own local state shape for now and map to this contract incrementally.
- Use `createCollectionQueryState()` for defaults.
- Use `normalizeCollectionQueryState()` when loading query state from URL/storage/runtime payloads.
- Use `normalizeCollectionQueryFilterPatch()` for partial filter updates.
