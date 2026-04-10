# Collection Browser Viewer System Redesign

## Summary

The current collection browser viewer works as a single dialog that can display media and basic details, but it is too limited for where the product needs to go next. It is currently optimized as a "preview/detail" surface, not as a reusable viewing system that can support richer interaction, collection workflows, and future content types.

This redesign proposes moving from a **single-purpose dialog** to a **reusable viewer system** with clear component boundaries:

- a shell/dialog orchestration layer
- a reusable media stage
- a metadata and action layer
- extension points for annotations, map/context, and IIIF-ready behavior

The direction should be **mobile-first**. The default experience should prioritize fast comprehension and simple action: see the media, understand what it is, and collect/use it. Rich metadata and advanced context should be progressively disclosed.

## Current State

Current implementation lives in:

- `src/apps/collection-browser/src/components/browser-viewer-dialog.js`

### What exists today

The current `open-browser-viewer-dialog` component handles all of the following within one file/component:

- dialog shell and header
- media loading and rendering logic
- image/video branching
- special embedded app path (`time-comparer`)
- metadata/details rendering
- source link rendering
- loading and error states

### Repo-grounded observations

1. **Duplicate title rendering**
   - Title is rendered in the dialog header (`#viewerTitle`) and then repeated in details as `.viewer-item-title`.
   - This creates visual redundancy and confusion in constrained mobile layouts.

2. **Single large scrollable body**
   - `.dialog-body` is one scroll container (`overflow: auto`), with media + details in a single flow.
   - This makes the media stage disappear while reading text, and weakens orientation.

3. **Weak mobile fit**
   - Mobile uses mostly the same bounded dialog dimensions and same structural layout.
   - There is no dedicated mobile-first split between media stage and metadata/action panel.

4. **Media and metadata are not cleanly separated**
   - Media rendering and details appending happen in one render path.
   - The viewer lacks explicit panel boundaries and independent scrolling behavior.

5. **Too many responsibilities in one component**
   - Shell orchestration, content-type routing, media loading, item details, and special-case app embedding are all in one element.
   - This makes reuse and extension harder.

6. **No proper zoom/pan image viewer yet**
   - Images are currently fit via CSS object-fit in a static stage.
   - There is no zoom in/out, pan, or reset interaction model.

7. **Not annotation/IIIF ready**
   - No overlay-layer model, no coordinate-aware interaction abstraction, no canvas-like staged architecture.

8. **Metadata/action structure is limited**
   - Current details include subtitle, description, and a source link.
   - It does not provide structured action hierarchy for collect/import, map, or future relation/context sections.

## Design Principles

1. **Mobile-first simplicity**
   - Start with a clean mobile experience; scale up to larger screens.

2. **Minimal default UI**
   - Show only what users need to identify, understand, and act.

3. **Progressive disclosure of metadata**
   - Essential metadata visible by default.
   - Secondary/future metadata under collapsible sections.

4. **Reusable media stage**
   - Build a media-viewer component that can be reused outside this dialog.

5. **Support for multiple media/content types**
   - Content-type adapters should route rendering without bloating shell logic.

6. **Annotation + IIIF readiness**
   - Architecture should support overlays and coordinate-aware interactions later.

7. **Action-oriented viewer**
   - Viewer should support navigation and collecting/import workflows as first-class actions.

8. **Separation of concerns**
   - Keep media viewing concerns separate from metadata/actions and shell orchestration.

## Proposed Viewer Architecture

### 1) `open-browser-viewer-dialog` (shell/layout/orchestration)

**Responsibilities**

- Dialog lifecycle (open/close/focus trapping/backdrop)
- High-level layout regions (header, media stage region, metadata/action region)
- Item-level orchestration: receives item and hands normalized data to child components
- Top-level events from child components (`collect`, `view-on-map`, `open-source`, etc.)

**Non-responsibilities**

- Should not directly implement media-specific zoom/pan logic
- Should not contain per-media-type rendering branches beyond high-level routing

### 2) `open-browser-media-viewer` (reusable media stage)

**Responsibilities**

- Render media stage for supported media types
- Maintain media interaction state (fit, zoom, pan, reset)
- Expose consistent API/events regardless of underlying media type
- Provide extension slots/layers for future annotations

**Sub-architecture (adapter-oriented)**

- image adapter (MVP)
- video adapter (existing parity)
- app/embed adapter
- 3D adapter (future)
- IIIF adapter (future)

### 3) Metadata/action panel component(s)

Recommended split:

- `open-browser-viewer-metadata-panel`
- `open-browser-viewer-actions`

**Responsibilities**

- Render essential text metadata
- Render primary actions
- Render collapsible sections for secondary/future metadata
- Keep semantic structure and accessibility labeling consistent

### 4) Collapsible metadata sections

- `open-browser-viewer-metadata-section` primitive for fold/expand behavior
- Consistent style and interaction across all sections

### 5) Future annotation layer

- `open-browser-viewer-annotation-layer` (future)
- Mounted inside or above media stage with zoom/transform awareness

## Target Layout

Mobile-first target layout:

1. **Compact header**
   - Minimal chrome
   - Close button retained

2. **Media stage on top (fixed region within dialog)**
   - Media remains visible while user reads/acts

3. **Metadata/actions panel below**
   - Independent scroll region

4. **Single title placement**
   - Title appears only once

### Title placement recommendation

- **Do not show title in both header and metadata.**
- **Recommended:** place title in metadata panel with summary/body.
- Keep header minimal (close button + optional lightweight utility actions if needed later).

This aligns the title with descriptive context and avoids duplication.

## Supported Content Types

Target viewer system should support:

1. **Standard image** (initial primary case)
2. **Future IIIF image** (tile/deep zoom/canvas-compatible path)
3. **Web component app/embed** (example: current `time-comparer` style integrations)
4. **3D/GLB viewer** (e.g., Three.js-backed object viewing)
5. **Future extensibility for additional media types**

This reframes the viewer from an “image dialog” into a **viewer platform** with a consistent shell and pluggable media adapters.

## Interaction Model

Baseline interaction behavior:

- Fit-to-screen by default
- Zoom in
- Zoom out
- Pan when zoomed
- Reset zoom

### Mobile touch behavior

- Pinch to zoom (where supported)
- Drag/pan when zoomed
- Single-tap should not accidentally trigger disruptive UI changes
- Controls should remain discoverable without overwhelming the stage

### Accessibility

- Keyboard-operable controls (zoom in/out/reset)
- Meaningful labels for all controls
- Screen-reader friendly structure for media status and metadata
- Maintain focus order from header → media controls → metadata/actions

### Content-type-specific controls

- Video: play/pause/scrub controls
- 3D: orbit/reset camera controls
- IIIF (future): viewport/region tools

These should be composed through adapter-specific control surfaces while preserving global consistency.

## Metadata and Action Model

Default metadata/action area should remain minimal and task-oriented.

### Essential now

- Title
- Short description/summary
- **Collect / Import** action (primary)
- **View on map** action
- **Open original source** link

### Useful but collapsible

- Source name
- Attribution
- License
- Canonical/source URL
- Download button (if allowed)
- Creator
- Date
- Source/collection context

### Future collapsible sections

- Location
- Time
- Relations
- Meaning/context
- Annotations

## Collect / Import Workflow

The viewer should be treated as a **task/action surface**, not only a detail surface.

### Core direction

- **Collect / Import** should be a primary visible action.
- Users should be able to act from the viewer without navigating away.

### MVP behavior

- Primary button: add current item to one of the user’s collections.
- Include an **Unsorted** default destination/bucket.
- Action feedback should clearly confirm destination.

### Future workflow extensions

- Quick-add to recent collection
- Drag from list/grid into Unsorted bucket
- Drag into a specific collection
- Multi-select/bulk collect

This aligns the viewer with organizing behavior, not just inspection behavior.

## Map / Relations / Context Hooks

The viewer should include hooks for cross-navigation and contextual interpretation:

- **View on map** action
- Relations entry points (related objects/items/events)
- Future time/location/meaning/context sections
- Deeper cross-navigation into connected material

Use collapsible/fold sections for most of this context to preserve a clean mobile default.

## Annotation and IIIF Readiness

This architecture must be ready for future annotation workflows, likely via IIIF or IIIF-compatible models.

### Required readiness capabilities

- Overlay layer model above media stage
- Zoom-aware region rendering
- Coordinate-aware interactions
- Annotation hit areas and selection
- Stable transform mapping between viewport and media coordinates

### IIIF direction (future-ready, not required immediately)

- Support a future IIIF image delivery mode (tile/deep zoom path)
- Support canvas-like abstraction for region addressing and annotation anchoring
- Keep media adapter boundaries clear so IIIF can be introduced without rewriting shell/layout

**Important:** do **not** require full IIIF implementation in current phase. Build architecture that allows incremental adoption.

## Mobile Behavior

Desired mobile behavior:

- Consistent dialog inset/margins from viewport edges
- Stable bounded dialog dimensions within viewport
- Media stage remains visible
- Metadata pane scrolls independently
- Avoid awkward overflow/jumping
- Close button easy to reach
- Clear visual hierarchy (media first, actions second, extended metadata folded)

## Experimental Development Strategy

Develop this first in a separate experimental app/version, then integrate proven pieces into production.

### Why start experimentally

- Reduces risk to production browsing flows
- Enables rapid iteration on layout and interaction without destabilizing current dialog
- Supports focused validation of media-stage interaction model and action hierarchy

### What to prototype first

- Mobile-first split layout
- Reusable `open-browser-media-viewer` with image zoom/pan/reset
- Metadata/action panel with essential + collapsible sections
- Collect/View on map/Open source action hierarchy
- Pluggable content-type adapter contract

### What to bring back to production

- Reusable media viewer component
- Metadata/action panel primitives
- Shell layout patterns that validate well on mobile
- Event/API contracts for collect/map/context actions

### Risk minimization

- Keep current production dialog intact while prototyping
- Migrate in phases with compatibility shims
- Validate against current browser item schema and interaction flows

## Implementation Phases

### Phase A: Clean up current dialog

- Remove duplicate title presentation
- Improve basic layout hierarchy without major architecture change

### Phase B: Split shell and media stage

- Introduce `open-browser-media-viewer`
- Move media logic out of dialog shell component

### Phase C: Add metadata/action folds

- Establish essential metadata + primary actions
- Add collapsible sections for secondary/future metadata

### Phase D: Add image interaction model

- Fit default
- Zoom in/out
- Pan when zoomed
- Reset

### Phase E: Pluggable viewer types

- Web component/embed path
- GLB/Three.js path
- Standardized adapter interface

### Phase F: Annotation-ready media stage

- Overlay layer support
- Coordinate/transform abstraction
- Annotation event hooks

### Phase G: IIIF-capable implementation

- Add IIIF image/canvas-compatible adapter
- Incrementally enable IIIF-driven region/annotation flows

## What to Keep Minimal

The default viewer experience should remain minimal, especially on mobile:

- Media visibility and immediate comprehension first
- Small, clear set of primary actions
- Rich metadata mostly behind progressive disclosure
- Advanced context and annotation surfaces available, but not forced into default view

## Recommendation

Implement the next-generation viewer as a reusable viewer system with a mobile-first layout and clear component boundaries.

**Recommended baseline decisions:**

- Title shown only once
- Minimal header with close control
- Media stage fixed at top
- Metadata/actions below in independent scroll region
- Primary visible actions: **Collect**, **View on map**, **Open source**
- Richer metadata behind collapsible folds
- Reusable media-viewer architecture with pluggable content adapters
- Prototype in a separate experimental app/version first, then integrate into production incrementally
