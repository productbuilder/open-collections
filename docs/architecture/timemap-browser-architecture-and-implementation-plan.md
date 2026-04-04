# Timemap Browser Architecture and Implementation Plan

## Overview

This document defines the architecture and implementation plan for a new `timemap-browser` app in Open Collections, plus a reusable shared map foundation that other apps can adopt.

The implementation is Web Components-based (vanilla JavaScript) and aligned with app-shell family guidance: meaningful UI units are components, rendering ownership remains in components, and non-visual orchestration lives in controllers/services/state modules.

Primary targets:

- `src/apps/timemap-browser`
- `src/shared/components/oc-map`
- `src/shared/data/query`
- `src/shared/data/spatial`

## Goals

- Add a new app at `src/apps/timemap-browser` with:
  - interactive map
  - timeline
  - filter controls
  - cards/drawer/detail UI for selected map features
- Introduce a reusable shared `oc-map` Web Component that is app-agnostic.
- Standardize a shared query model between `collection-browser` and `timemap-browser`.
- Build map-specific spatial loading architecture that scales to high-density datasets (100,000+ points expected in Hilversum scenarios).
- Support current and future map visualization needs:
  - points, lines, polygons
  - custom cartographic styling
  - historical raster/image overlays (for example Allmaps)
  - extension seam for future Three.js-based custom render layers and 3D.

## Non-goals

- `oc-map` will not implement timemap-specific timeline logic.
- `oc-map` will not own cards/drawer/detail behavior.
- `oc-map` will not implement collection-domain business rules.
- Timemap v1 will not deliver full 3D tiles rendering; this plan defines the integration seam and phased path.
- Timemap v1 will not replace `collection-browser`; both apps share query semantics but optimize for different interaction and retrieval patterns.

## Decision record: Why MapLibre GL JS

MapLibre GL JS is selected as the base map engine because it best matches long-term architectural needs:

- Open-source governance and licensing fit Open Collections strategy.
- Strong native support for point, line, and polygon rendering.
- Robust style system for custom visual language.
- Good fit for raster/image overlays used by historical mapping experiences such as Allmaps.
- Custom layer interfaces provide a practical extension path for Three.js interop and future 3D layers.
- Better long-term fit than Leaflet for high-volume vector rendering + custom render-layer extensibility in this use case.

## Architecture summary

The design separates shared map rendering infrastructure from timemap-specific composition and business state.

- `oc-map` (shared primitive/component) owns MapLibre lifecycle and generic map behaviors.
- `timemap-browser` app components own app composition, user flow, and state orchestration.
- Shared query modules define canonical query/filter semantics used by both browser and timemap apps.
- Spatial modules adapt canonical query state into viewport/zoom-aware map payload requests.

### Responsibility boundaries

**`oc-map` owns:**

- map creation/destruction and style bootstrapping
- source/layer registration and updates
- feature interaction plumbing (click/hover)
- viewport event emission
- generic overlays and custom-layer registration APIs

**`timemap-browser` owns:**

- active filters
- active time range
- selected/hovered feature state
- visible overlay preferences
- viewport state as app state
- coordination between map, timeline, filters, and card/detail panel

**Shared data modules own:**

- canonical query/filter model
- query serialization/normalization
- spatial query adaptation and caching strategy

## Shared reusable map foundation

### `oc-map` component location

- `src/shared/components/oc-map/`

### Design principles

- App-agnostic API.
- Shadow DOM component by default.
- Explicit external API through properties/methods/events.
- No timemap-specific business logic.

### Proposed minimal public API

Methods/properties (final naming can follow existing conventions in shared components):

- `setGeoJsonData({ sourceId, data })`
  - update source data for points/lines/polygons.
- `setLayerVisibility({ layerId, visible })`
  - toggle layer visibility.
- `fitToBounds(bounds, options?)`
  - fit viewport to explicit bounds.
- `fitToData({ sourceId, padding? })`
  - fit viewport to source extent.
- `setHighlightedFeatures({ sourceId, featureIds })`
  - set style-state driven highlight selection.
- `addRasterOverlay({ id, tiles?, image?, bounds?, opacity? })`
  - register/toggle raster or image overlays.
- `registerCustomRenderLayer({ id, beforeId?, renderAdapter })`
  - extension seam for future Three.js/custom rendering.

### Proposed emitted events

- `oc-map-ready`
  - map style loaded and map instance ready for operations.
- `oc-map-feature-click`
  - includes source/layer/feature identity.
- `oc-map-feature-hover`
  - includes hover enter/move/leave metadata.
- `oc-map-moveend`
  - stable viewport state after move/zoom.

These events should use `CustomEvent` with clear `detail` payload contracts.

## Timemap app composition

### App location

- `src/apps/timemap-browser/`

### Proposed timemap components/modules

- `timemap-app`
  - app root and orchestration shell for the timemap experience.
- `timemap-layout`
  - responsive layout composition (map region, filters, timeline, cards/drawer).
- `timemap-filters`
  - query/filter controls.
- `timemap-timeline`
  - time-range interaction and temporal navigation.
- `timemap-cards-panel`
  - selected results, drawer, and detail affordances.
- `timemap-controller`
  - coordination logic between state, queries, and view components.
- `timemap-state`
  - single app-level state model/store.

### Composition rule

Timemap composes shared pieces (`oc-map` + shared query/spatial modules + shared primitives) and keeps timemap-specific logic in timemap modules.

No timeline/card/filter business rules are embedded in `oc-map`.

## Shared query model with collection-browser

`collection-browser` and `timemap-browser` should share canonical domain semantics:

- filter model
- search/query semantics
- collection/source selection logic
- item/category logic
- time filtering model
- canonical IDs
- base metadata contract

However, retrieval/rendering pipelines diverge by interaction mode:

- `collection-browser`: list/card-oriented retrieval and incremental feed rendering.
- `timemap-browser`: viewport/zoom/spatial-density-oriented retrieval and rendering.

This keeps one business query language while allowing specialized projection/rendering strategies.

## Data model and loading strategy

Timemap is a spatial projection of the same canonical query state, not a separate business rules system.

### Primary map query input

Map requests should use:

- viewport bounds
- zoom level
- canonical filters
- active time range
- relevant collection/source scope

### Zoom-dependent payload strategy

Return payload shape by zoom tier:

- **Low zoom**
  - cluster/summarized points
  - simplified lines/polygons
  - aggregate counts/representative metadata
- **Medium zoom**
  - smaller clusters + representative individual features
  - moderate geometry detail
- **High zoom**
  - individual points
  - detailed visible geometry
  - richer per-feature visual attributes where needed

### Required from initial implementation

- clustering enabled from first version
- simplified geometry strategy from first version
- separate visual payload from detail payload

The map should request lightweight visual payloads first; card/detail panels request fuller item payloads on demand.

### Suggested shared data module structure

- `src/shared/data/query/`
  - shared query state schema
  - query normalization/serialization
  - shared filter helpers
- `src/shared/data/spatial/`
  - spatial query builder (viewport + zoom + canonical query)
  - spatial source adapter(s)
  - clustering helpers/contracts
  - cache key/signature builder
  - viewport/tile response cache

## Performance strategy

Performance is a core architectural requirement, not a later optimization pass.

### Baseline strategies

- viewport-driven data loading (never preload all map points)
- zoom-tiered payload shaping
- clustering at all non-detail zoom tiers
- line/polygon simplification by zoom
- debounced move-end querying
- cache responses by viewport/tile + zoom + filter/time signature
- use stable feature IDs and source-layer diff updates to minimize redraw cost
- separate map paint data from heavy card/detail data

### State and event flow constraints

- app state is source of truth; map reflects state.
- map interaction events dispatch intent (`feature-click`, `moveend`) to controller/state.
- controller computes next query and updates both map payload and side panels.

## Phased implementation plan

### Phase 1: Shared `oc-map` foundation

- scaffold `src/shared/components/oc-map`
- initialize MapLibre lifecycle and style boot path
- implement core API: data updates, layer toggles, fit, highlight
- emit base events (`ready`, `feature-click`, `feature-hover`, `moveend`)

### Phase 2: Overlay and custom-layer extension seams

- add raster/image overlay API needed for historical overlays (Allmaps path)
- add custom render layer registration seam for Three.js interop
- document adapter contract for future 3D layers

### Phase 3: Timemap app scaffolding

- scaffold `src/apps/timemap-browser`
- implement `timemap-app` and `timemap-layout`
- compose `oc-map` with placeholder filters/timeline/cards panel

### Phase 4: Shared query + spatial adapter layer

- create `src/shared/data/query` canonical query modules
- create `src/shared/data/spatial` viewport/spatial modules
- map canonical query state to zoom/viewport requests
- implement cache signatures and response cache behavior

### Phase 5: Feature-complete timemap interactions

- wire `timemap-filters`, `timemap-timeline`, and `timemap-cards-panel`
- implement selection/hover/viewport synchronization in `timemap-state`
- fetch detail payload lazily for selected features

### Phase 6: Advanced overlays, optimization, and 3D readiness

- refine Allmaps/historical overlay workflows
- performance profiling and tuning for high-density datasets
- prototype Three.js custom render layers and validate upgrade path to richer 3D content

## Open questions

- Which backend/service layer will provide zoom-tiered spatial responses, and what API contract should be standardized first?
- Should clustering happen server-side, client-side, or hybrid by dataset size and zoom tier?
- What is the canonical tiling/index strategy (vector tiles, geojson tiles, or bbox chunk endpoints) for very large datasets?
- What geometry simplification pipeline and tolerance policy should be used per zoom level?
- How should timeline bucketing interact with cluster summaries (counts per period vs active interval only)?
- Which detail fields are mandatory in map visual payload vs deferred detail payload?
- What shared style token system (colors, symbols, layer order) should `oc-map` consume from app-shell/shared design primitives?
- What telemetry/performance metrics are required (query latency, frame time, tile cache hit rate, interaction latency) for production readiness?

## Implementation notes

- This plan intentionally treats viewport-based loading and clustering as foundational requirements.
- `timemap-browser` should be built incrementally with reusable shared modules to avoid app-local map silos.
- The architecture keeps one canonical query language across apps while allowing multiple UI projections (feed/list vs map/timeline).
