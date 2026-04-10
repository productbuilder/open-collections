# Collection Browser Scale-Readiness Assessment (2026-04-10)

## Scope

This note reviews the current collection browser architecture after the shell-owned canonical refactor, including:

- shell-owned startup ingestion
- shell-owned canonical runtime store
- list and map adapters over canonical data
- projection caching and diagnostics
- restored mixed browse/feed behavior
- recent list rendering, scroll, thumbnail, and Sources-mode fixes

The goal is to assess what is solid now, what will bottleneck first at larger dataset sizes, and what the next practical engineering steps should be.

## 1. Current strengths

### What is solid now

- Ownership is materially cleaner. Ingestion and canonical data ownership now sit in the shell runtime instead of being split across surfaces.
- List and map both consume the same canonical runtime store through explicit adapters. That removes a large class of divergence bugs.
- The runtime store already maintains useful secondary indexes for tags, types, temporal items, spatial items, collection-by-source, and item-by-collection.
- Projection caching is in place and avoids repeated recompute when the query and store version are stable.
- The list all-mode feed is now sessionized and appendable rather than forcing one large up-front render.
- The list surface no longer rebuilds the entire subtree on append; DOM preservation, scheduled chunk append, and scroll preservation fixed the most visible correctness/performance regressions.
- The map no longer depends on the removed hardcoded manifest path and now consumes shell-owned canonical data.
- Diagnostics are materially better than before. Ingestion, projection, and cache timing/count signals exist and are good enough to support the next optimization pass.

### Problems successfully removed

- surface-local ingestion as the active path
- duplicated list/map normalization logic as the primary runtime path
- hardcoded map manifest loading in the active path
- full-list DOM replacement on append
- detail-open scroll reset in the list surface
- missing source thumbnails caused by adapter projection loss
- Sources-mode correctness bugs caused by selection/scoped-source leakage

## 2. Remaining bottlenecks

### Highest-impact bottlenecks

1. `runtimeStore.getSnapshot()` is currently a full deep-clone boundary.
   Every list or map projection clones the entire store, including all entity maps and derived indexes. This is the single most important current scale risk for both memory churn and main-thread time.

2. List projection still performs repeated full scans over collections and items.
   The adapter builds scoped items in one pass, then derives filtered collection/source sets, then repeatedly filters collections/items again while building cards. That is acceptable at modest size, but it is still whole-store work per cache miss.

3. Map projection is also full-scan, full-filter per viewport-relevant change.
   It iterates all items, applies all active filters, then applies bbox checks per item. There is no spatial index or clustering structure in the canonical map path yet.

4. The list surface still accumulates a growing DOM in all-mode.
   The append optimization removed churn, but not node count. Very large feeds will still grow into a large live DOM and eventually hit layout, memory, and image decoding pressure.

5. The shell still uses event/bridge delivery into legacy child apps.
   This is much better than duplicate ingestion, but it still means projection payload serialization-like copying, event hops, and child-side interpretation instead of shell-native surface ownership.

### Other notable bottlenecks

- Startup ingestion and normalization are sequential per accepted source/collection in the current ingestion service.
- `getDiagnostics()` in the runtime store recomputes `includedItems` via a full scan.
- Map viewport filtering currently reacts on the main thread and remains item-level rather than indexed/clustered.
- The timemap app still clones controller state and feature arrays aggressively on updates.
- Filter changes still invalidate full projections instead of leveraging precomputed faceting/query indexes.

## 3. Algorithmic complexity

### Startup ingestion

- Registration intake: roughly `O(r log r)` if sorting/prioritization occurs in intake, otherwise near `O(r)`.
- Descriptor resolution + manifest fetch: network-dominated, effectively `O(r + c)` requests for `r` sources and `c` collections.
- Manifest normalization: `O(total_items)` across all fetched manifests.
- Store population: approximately `O(total_items * index_updates)`.
- Current issue: work is mostly sequential in the ingestion service, so wall-clock time scales poorly with many sources/collections even before CPU becomes dominant.

### Runtime store snapshot

- `getSnapshot()`: effectively `O(S + C + I + index_entries)` with deep-clone overhead.
- This cost is paid on each uncached list projection and each uncached map projection.

### List projection

- Initial snapshot clone: `O(S + C + I)` plus index cloning.
- Item filter pass: `O(I)`.
- Filter option aggregation: `O(filtered_or_pretype_items)`.
- Source card build: currently includes repeated collection and item filtering per source, which trends toward `O(S*C + S*I)` in the naive case.
- Collection card build: repeated per-collection filtering over `scopedItems`, trending toward `O(C*I)`.
- Feed composition input prep: `O(S + C + I)` on the card arrays.

In practice, the repeated `.filter()` calls inside card builders are the main avoidable cost after snapshot cloning.

### Mixed browse/feed composition

- Candidate wrapping: `O(S + C + I)`.
- Ordering and feed assembly: roughly linear in card count with bounded local scan windows during chunk selection.
- Append chunk growth itself is cheap relative to full projection rebuild, because the heavy cost is upstream in producing the card arrays.

### Map projection

- Snapshot clone: `O(S + C + I)`.
- Per-item query filtering: `O(I)`.
- Viewport bbox filtering: also `O(I)` because it is applied item-by-item after other filters.
- No spatial index means viewport changes remain linear in item count.

### Filter changes

- Cache miss path currently implies full snapshot clone + full projection rebuild.
- Complexity is effectively list: `O(S + C + I + repeated filters)`, map: `O(S + C + I)`.

### Viewport changes

- Shell map projection recompute is linear in all items whenever the normalized viewport key changes enough to invalidate the map cache.
- The timemap child also runs local visible-feature filtering over the response payload, adding more `O(visible_features)` work.

## 4. Frontend scale limits

### List virtualization/windowing

This is the next frontend necessity.

Current append-only preservation is good enough for moderate datasets, but not for large ones. Once all-mode can realistically render several hundred cards with images, virtualization becomes the right next step. The feed assembly already caps at 420 cards, which is a strong signal that the architecture knows there is a practical DOM ceiling.

Recommendation:

- Near-term acceptable without virtualization: low hundreds of rendered cards.
- Virtualization should become a priority before pushing beyond that, especially on lower-memory devices.

### Map clustering/indexing

This is the next map necessity.

Current map projection is still item-level and bbox-linear. That is acceptable for small-to-mid georeferenced datasets, but clustering or an actual spatial index becomes necessary once viewport-driven recalculation starts hitting thousands to tens of thousands of georeferenced items.

Recommendation:

- Add a client-side spatial index first if near-term scale remains browser-local.
- Move to server-side clustered/tiled endpoints when dataset size or shared traffic makes browser-side full scans unattractive.

### In-memory store sufficiency

The current in-memory canonical store is sufficient for near-term scale if datasets remain in the low-to-mid tens of thousands of items and projections are not invalidated constantly.

It will start to strain when:

- full snapshots are cloned repeatedly
- multiple large projection payloads are cached simultaneously
- the list DOM keeps many image-heavy cards mounted
- map feature arrays and child-controller clones duplicate the same dataset repeatedly

### Browser memory pressure

Likely pressure points:

- deep-cloned snapshots
- duplicated card models in list projections
- cached full all-mode entity arrays
- image-heavy DOM in the list surface
- cloned map feature arrays in controller state

The risk is not only total memory footprint, but GC churn and pause time caused by repeated full-object allocation.

## 5. Backend opportunities

### Highest-value later backend additions

1. Precomputed canonical indexes
- source -> collections
- collection -> included items
- type/tag facet counts
- temporal buckets
- spatial index materialization

2. Viewport query endpoints
- return only features intersecting viewport
- optionally return clustered summaries by zoom
- reduce browser-side full scans and feature duplication

3. Faceting/filter endpoints
- let the backend answer filter counts against large corpora
- avoid rebuilding full facet counts client-side on every broad filter change

4. Ranked feed or browse-window precomputation
- useful if all-mode becomes more editorial/ranked over time
- lower value than viewport and faceting endpoints unless feed personalization/diversity becomes more complex

5. Cluster/tile endpoints
- likely the map scaling breakpoint solution for truly large spatial datasets

### What does not need to move yet

- detail dialog state
- incremental list append mechanics
- UI-level exposure memory / simple feed pacing
- lightweight shell projection cache

Those are still reasonable in the frontend as long as projections are fed by a more efficient data/query layer.

## 6. Recommended next priorities

### Priority 1: remove full-store cloning from hot projection paths

Replace `runtimeStore.getSnapshot()` in projection code with a read-only structured view or direct accessor API that does not deep-clone the entire store on every recompute.

Why first:

- it affects both list and map
- it affects every cache miss
- it is likely the largest current main-thread and memory multiplier

### Priority 2: add list virtualization/windowing

The append-only DOM fix bought headroom, but it does not change the eventual node-count ceiling.

Why second:

- it directly addresses the next visible frontend scale failure
- it preserves the current feed model while reducing DOM/layout/image cost

### Priority 3: add client-side spatial indexing or clustering for map projection

The current map path is still linear in item count per viewport refresh.

Why third:

- the map path will hit scalability issues earlier than a virtualized list once georeferenced item counts grow
- it improves both responsiveness and eventual backend migration readiness

### Priority 4: add a browser-level interaction test harness

The recent regression fixes were correct, but many of them are enforced through logic-level tests rather than mounted-browser interaction tests.

Why now:

- scrolling, dialog focus, append stability, and tab/view transitions are exactly the areas where logic tests are weaker
- it will reduce regression risk while the surfaces are still legacy-child based

### Priority 5: reduce bridge reliance and move toward shell-native surfaces

The shell still computes canonical projections, then pushes them through compatibility events into legacy child apps.

Why later than the items above:

- the bridge is not the first raw performance limit
- but it is still an architectural seam that duplicates state interpretation and complicates correctness

### Priority 6: evaluate worker or backend query execution after the above

Off-main-thread projection or backend query services become more attractive once the current client-side algorithm/data-shape inefficiencies are reduced. Otherwise they risk preserving inefficient data movement under a different execution boundary.

## 7. Concrete recommendation

Recommended next 4 engineering steps:

1. Replace full `getSnapshot()` deep-clone usage in list/map projection paths with read-only store accessors or a cheap immutable view.
2. Add list virtualization/windowing for all-mode and item-heavy tabs while preserving the current append/feed behavior.
3. Add a spatial index or clustering layer for the canonical map path and stop doing pure linear viewport scans over all items.
4. Add a browser-level interaction test harness covering tab switching, append growth, dialog open/close, and map viewport-driven updates.

## Bottom line

The canonical refactor succeeded at the architecture level: ownership is cleaner, correctness is materially better, and the active list/map paths now share one source of truth.

The next scale problems are no longer “wrong architecture” problems. They are now classic hot-path efficiency problems:

- full-store cloning
- repeated full-array filtering in projections
- non-virtualized list DOM growth
- linear map viewport scans
- compatibility bridge overhead that should eventually disappear

That is a much better place to be.
