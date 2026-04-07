# Collection Browser browse hierarchy plan

## Purpose

This document defines the intended browse hierarchy, navigation model, and top-level card surfaces for `collection-browser`.

It complements `docs/architecture/source-model.md`.

- `source-model.md` defines protocol/storage entry-point terminology.
- This document defines how Browser should present those entry points as a viewing/discovery-first browse experience.

## Why this document exists

The protocol/source model and the Browser browse model are related, but they are not identical.

At the protocol layer, Browser and Manager can consume entry points that resolve to either:

- `collections.json`
- `collection.json`

For Browser discovery workflows, `source.json` is the preferred entry point in most cases because it carries richer source-level context for source, collection, and mixed-feed presentation.

At the Browser UI layer, users need a clearer hierarchy:

- Sources
- Collections
- Items

To support that, Browser should normalize protocol entry points into a clearer browse model instead of exposing raw entry-point differences directly in top-level UI.

## Browser hierarchy

Top-level Browser browse filters should be:

- All
- Sources
- Collections
- Items

These are browse surfaces and filters, not protocol file types.

### Sources

In Browser, a top-level **source card** should represent a browseable multi-collection root.

In the current intended Browser model:

- `collections.json` roots should appear as top-level source cards.
- directly connected `collection.json` entries should not appear as top-level source cards.

This is intentionally stricter than the lower-level protocol definition of a source.

### Collections

In Browser, a **collection card** should represent one collection that can be opened to browse items.

Collection cards should include:

- collections discovered from a `collections.json` source
- directly connected single-collection entries normalized into collection-level browse content

This means Browser may present a directly connected `collection.json` entry as a collection card rather than as a source card.

### Items

In Browser, an **item card** should represent one browseable media/content item within a collection.

Items can be surfaced from:

- one selected collection
- one selected source
- all currently available collections across all browseable sources

## Protocol model vs Browser browse model

Keep these layers distinct:

### Protocol / runtime entry model

- entry points may resolve to either `collections.json` or `collection.json`
- Browser and Manager should still be able to consume both entry forms
- storage/runtime flexibility remains important
- direct collection entry remains valid, but may require source-context enrichment in Browser models when source-level context is needed in cards or orchestration

### Browser browse model

- source cards represent multi-collection browse roots
- collection cards represent collections, including normalized direct single-collection entries
- item cards represent items inside collections

This separation preserves protocol flexibility while making the Browser hierarchy easier to understand.

## Normalized Browser browse categories

Browser should use an explicit normalized category/type seam for browse cards and browse view models.

Recommended normalized field:

- `browseKind`: `source` | `collection` | `item`

Browser may also keep a more specific source-entry classification where helpful, for example:

- `entryKind`: `multi-collection-root` | `single-collection-entry`

But top-level Browser rendering and navigation should primarily rely on the normalized browse kind rather than raw manifest filename checks scattered across the UI.

## Top-level surfaces

### All

`All` is a mixed browse surface.

It should show source cards, collection cards, and item cards together in one overview.

This is not a separate depth level. It is a top-level mixed browse filter over the same normalized Browser browse entities.

### Sources

`Sources` should show only top-level source cards.

At this phase, source cards should correspond to multi-collection roots backed by `collections.json`.

### Collections

`Collections` should show all collection cards currently available to Browser.

That includes:

- collections loaded from all multi-collection sources
- normalized directly connected single-collection entries

### Items

`Items` should show all item cards across all currently available collections.

At the top level, this is an aggregated item surface.

## Navigation model

Browser navigation should be relative to the level the user came from.

Examples:

- source -> collections for that source
- collection -> items for that collection
- item -> item page or viewer
- source from All -> collections for that source
- collection from All -> items for that collection
- item from All -> item page or viewer

### Back behavior

When the user goes one level deeper, Browser should show a back button in the top-left corner.

Rules:

- back returns to the prior Browser level/context the user came from
- back should not be hardcoded to one absolute parent level
- title can appear to the right of the back button when back is present

This implies Browser should maintain a modest navigation/history stack or equivalent prior-view context model.

## Layout hierarchy for the mixed All view

The mixed `All` surface should visually reinforce hierarchy.

Desktop target direction:

- 4-column grid
- source cards span `2 x 2`
- collection cards span `2 x 1`
- item cards span `1 x 1`

This layout rule is Browser-local presentation logic.

Do not move these grid-span rules into shared primitives.

## Shared primitive vs Browser-local layout

A shared preview-summary card primitive is appropriate for:

- title
- optional subtitle
- preview image strip
- count label
- whole-card activation behavior

Browser-specific hierarchy and layout decisions should remain local to Browser components, for example:

- mixed `All` grid composition
- source vs collection vs item span sizing
- top-level filter chrome
- Browser-specific navigation state

## Canonical browse builders

Browser should move toward explicit normalized builders for its browse surfaces.

Recommended seams:

- a builder for all source browse cards
- a builder for all collection browse cards
- a builder for all item browse cards
- a builder for the mixed `All` browse surface

The goal is to avoid duplicating or re-deriving Browser browse semantics independently inside multiple rendering components.

## Incremental implementation guidance

Implement this direction in small passes.

Recommended order:

1. document the Browser browse hierarchy and normalized browse kinds
2. correct top-level source classification so `Sources` only shows multi-collection roots
3. normalize direct single-collection entries into collection cards
4. introduce canonical Browser browse builders
5. add the mixed `All` top-level surface
6. add Browser-local mixed-grid hierarchy sizing
7. add relative navigation/back-stack behavior

## Boundary reminders

Preserve these architectural boundaries while implementing this plan:

- Browser remains viewing/discovery-first
- shared primitives stay modest
- shell owns shell concerns only
- Browser owns Browser browse state and Browser-specific UI composition
- runtime/services own non-visual integration/data concerns

Also preserve:

- standalone Browser usability
- embedded Browser usability inside `app-shell`
- incremental migration over broad rewrites
