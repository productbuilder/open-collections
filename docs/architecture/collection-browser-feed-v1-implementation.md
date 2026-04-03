# Browser Feed v1 Implementation

## Purpose and scope

This document is the implementation reference for the current browser feed in `src/apps/collection-browser`.

It describes the behavior that is implemented now in frontend code, including context resolution, candidate preparation, mode slicing, all-mode stream assembly, chunked append, and exposure-memory renewal. It is not a conceptual-only target spec.

Current scope:

- frontend/browser-driven feed orchestration
- deterministic ordering with lightweight session renewal
- browser-local exposure memory (no shared backend state yet)
- structured to support later backend orchestration without changing core feed concepts

## Implementation modules (current)

Primary modules:

- `src/apps/collection-browser/src/app.js`
  - resolves browse context
  - builds context candidate pools
  - defines mode semantics and viewport payloads
  - owns all-mode feed session reset/continuation
- `src/apps/collection-browser/src/state/feed/candidate-pools.js`
  - normalizes source/collection/item candidates from card entities
- `src/apps/collection-browser/src/state/feed/assembly.js`
  - deterministic all-mode stream generator
  - source-bucketed item selection
  - anchor pacing/reuse logic
- `src/apps/collection-browser/src/state/feed/exposure-memory.js`
  - browser `localStorage` seen-memory and recency ranking
- `src/apps/collection-browser/src/components/browser-collection-browser.js`
  - all-mode append sentinel + `IntersectionObserver`

## Shared browse-context model

The browser resolves one current browse context and derives all browse slices from it.

`resolveBrowseContext()` returns:

- `scope`: `"all" | "source" | "collection"`
- `sourceScopeId`
- `selectedCollectionManifestUrl`
- `selectedCollection`

Context behavior in embedded runtime:

1. **Unscoped all-sources context**
   - no selected collection
   - no explicit source scope
   - `scope = "all"`
2. **Explicit source-scoped context**
   - no selected collection
   - explicit source selected
   - `scope = "source"`
3. **Selected collection context**
   - selected manifest URL resolved to a collection
   - `scope = "collection"`

In non-embedded runtime, context is treated as collection scope and uses the currently loaded collection.

## Shared candidate pools

`buildBrowseCandidatePools(context)` builds three pools from the resolved context:

- `sources`
- `collections`
- `items`

Pool derivation:

- collections are source-filtered when `sourceScopeId` exists
- items are:
  - selected collection items when in `collection` scope
  - source-filtered items when in `source` scope
  - all source items when in `all` scope

Feed candidate normalization (`candidate-pools.js`) wraps each entity as a normalized candidate with stable fields (`id`, `type`, `sourceId`, `collectionId`, `title`, etc.) and retains the original `entity` object.

Why this matters:

- normalization gives deterministic selection inputs
- keeping `entity` preserves existing rendering behavior and card contracts
- selection logic can evolve without rewriting UI cards

## Mode semantics (implemented)

Mode behavior is implemented in `viewportModel()` and `setEmbeddedViewMode()`:

- **All**
  - mixed stream assembled from the current browse context
  - uses long-lived stream session and chunk append
- **Sources**
  - intentionally global/top-level in current implementation
  - uses `resolveGlobalSourceCards()`
  - clearing to Sources mode resets drill-scoped context
- **Collections**
  - collection slice of current browse context
  - unscoped across all sources unless source/collection context is active
- **Items**
  - item slice of current browse context
  - unscoped across all sources unless source/collection context is active

Important current rule: **Sources is global for now; Collections and Items derive from the resolved browse context.**

## All-mode mixed stream generator

All-mode stream behavior is implemented as a deterministic session state machine in `assembly.js`.

### Session/state model

- `createBrowseFeedStreamSession()` creates a session only for `mode = "all"`
- `createAllModeFeedStreamState()` creates long-lived state with:
  - candidate pools
  - cursors
  - source recency windows and usage counts
  - emitted-entity tracking
  - anchor reuse tracking
  - pacing state for source/collection anchor recurrence
  - deferred-recent IDs from exposure memory

### Card-type selection strategy

`pickNextCandidate()` determines the next card by type attempt order:

- default preference is item-led
- source/collection anchors are inserted when pacing indicates they are due/overdue
- overdue anchor type is prioritized when both are due

This yields an item-forward mixed feed with recurring source and collection anchors.

### Deterministic choose-next-card logic

Selection uses tuple score comparison (`compareCandidateScores`) across deterministic penalties/factors such as:

- deferred-recent penalty (early-feed deferral for recently seen IDs)
- exposure recency penalty
- anchor reuse penalty
- same-source adjacency and recent source usage
- global per-source usage count
- candidate index fallback

### Source diversity + anchor spacing

- source diversity is applied via source-use tracking windows
- anchor cards (source/collection) can be reused, but only after minimum gaps:
  - source reuse gap
  - collection reuse gap
- source and collection anchors recur using pacing step sequences

### Practical depth cap

Feed depth is capped by:

- total candidate count across pools
- `ALL_MODE_MAX_CARDS` hard cap

So the stream is deep but not unbounded.

## Source-bucketed item selection

Flat item selection was not sufficient for cross-source fairness in mixed feeds.

Current implementation builds per-source item buckets (`buildItemSourceBuckets`) and selects the next item by scoring candidate sources (`pickItemCandidateFromSourceBuckets`) using:

- item exposure recency
- same-as-last-item-source penalty
- recent overall source usage
- recent item-source usage
- total item-source usage
- per-bucket cursor position
- stable source order index

Why this matters:

- prevents large sources from dominating item cards
- gives smaller sources repeated opportunities to surface items
- stays deterministic while still rotating source exposure

## Lazy append / chunk loading (frontend-driven)

All-mode rendering is chunked in UI:

- initial chunk is loaded when session is created (`ALL_MODE_INITIAL_CHUNK_SIZE`)
- additional chunks append on demand (`ALL_MODE_APPEND_CHUNK_SIZE`)
- append trigger uses an all-mode sentinel + `IntersectionObserver`
- append requests dispatch `all-feed-append-request` and reuse the same session state

This is frontend chunk continuation, not backend pagination.

Session reset behavior:

- session key includes current browse context and candidate identities
- when key changes (context/data changed), a new session is created and initial chunk restarts

## Frontend-only exposure memory and renewal

Exposure memory is currently browser-only (`exposure-memory.js`):

- namespace-scoped local storage key per browse context
- tracks seen entities by `{type}:{id}`
- records sequence/time metadata
- provides recency rank and most-recent ID lists

Usage in stream assembly:

- source/collection anchors receive stronger recency pressure
- items receive lighter recency pressure (clamped penalty)
- recently seen IDs are deferred in early feed windows
- entities are marked seen when emitted into the feed chunk

Result:

- deterministic feed generation within session
- lightly renewed feel across reloads/sessions without backend state

## Scoped vs unscoped Collections/Items behavior

Current behavior from browse context + pool building:

- with no explicit source and no selected collection:
  - Collections and Items are unscoped across all available sources
- with explicit source scope:
  - Collections and Items are filtered to that source
- with selected collection:
  - Items come from selected collection items
  - Collections remain source-scoped when source scope exists

Sources mode remains global regardless of drill state.

## Current limitations / known constraints

- frontend-only orchestration (no server ranking/pagination)
- exposure memory is local-browser only
- no shared cross-user exposure state
- no ML/relevance scoring layer
- no integrated filter/ranking policy framework yet
- practical feed cap still exists
- mode semantics are intentionally asymmetric (global Sources vs context-bound Collections/Items)

## Backend migration notes (keep model stable)

Likely server-side candidates for a later phase:

- candidate preparation and normalization
- shared exposure memory and recency controls
- stronger ranking and fairness controls
- continuation tokens / paginated feed append

Core model to keep stable across migration:

- one resolved browse context
- shared candidate pools
- All mode as mixed stream
- other modes as slices of the same context

Maintaining that model should allow backend evolution without changing the browser interaction model.
