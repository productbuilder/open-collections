# Reusable Items, Collection Entries, Annotations, and Relations

## Overview

This note proposes a simple layered model for how Open Collections can support reuse, curation, interpretation, and linking without becoming conceptually messy.

A useful framing is:

- a source media URL or source record may become a reusable item
- that item may appear in one collection or many collections
- each collection may frame that item differently
- annotations may accumulate over time
- relations may connect items, collection uses, annotations, collections, and sources

The goal is not to define a final technical schema. The goal is to give Open Collections a clean conceptual model that can guide product narrative, data thinking, frontend UX, and future protocol direction.

## 1. Why this model matters

The same media or source record may be reused multiple times.

A museum record, a photo URL, a document, or a harvested source entry may first enter Open Collections as source material. Later, that same thing may be selected into a curated collection, reused in a second collection, annotated by a curator, linked to related items, or interpreted differently in a new context.

That creates a practical modeling problem:

- the same underlying thing may appear more than once
- different collections may frame the same thing differently
- annotations may accumulate over time
- links between things may become important for navigation and understanding
- provenance and reuse need to remain understandable

Open Collections needs a way to support those patterns without collapsing everything into one overloaded concept of “item.”

## 2. Proposed layered model

A simple layered model can help.

### Source

**Source** describes where something came from.

This may include:

- source media URL
- source record URL
- source institution
- source system
- source identifier
- source attribution or provenance details

The source layer answers the question: **where did this come from?**

### Item

**Item** is the reusable thing in Open Collections.

It should have a stable identity in Open Collections and carry core metadata that remains useful across contexts.

Examples of core item properties may include:

- stable item ID
- title or label
- canonical media or preview reference
- basic description
- basic rights or attribution information
- preserved source references

The item layer answers the question: **what is the reusable thing we are working with?**

### Collection entry

**Collection entry** is the item as used in a specific collection.

This is the contextual layer. It represents the fact that a collection has chosen to include the item and may give it local framing.

That framing might include:

- local title or display label
- collection-specific description or caption
- ordering or grouping
- featured status
- local thumbnail or crop choice
- local interpretive context

The collection entry layer answers the question: **how is this item being used here?**

### Annotation

**Annotation** is additive commentary or interpretive metadata.

Annotations may attach to:

- an item
- a collection entry
- a source
- another annotation in some future cases

Annotations might include:

- notes
- tags
- transcriptions
- interpretive commentary
- corrections
- editorial remarks
- audience-specific teaching or research notes

The annotation layer answers the question: **what has been added on top of this?**

### Relation

**Relation** is an explicit link between things.

Relations may connect:

- item to item
- collection entry to item
- collection to item
- annotation to item
- annotation to collection entry
- source to item
- collection to collection

The relation layer answers the question: **how are these things connected?**

## 3. Keep items reusable

Core items should remain reusable.

That means an item should not absorb every local interpretation, collection-specific caption, or later editorial use into one flattened record. If it does, the item stops being a reusable building block and becomes a confusing bundle of all past uses.

A better approach is to keep the item focused on stable identity and core metadata. That makes it easier to:

- reuse the same item across multiple collections
- preserve a clear sense of provenance
- compare different contextual uses later
- support future exports, linking, and indexing

The item should be the reusable center, not the container for every possible interpretation.

## 4. Keep collection use contextual

The same item may appear differently in different curated collections.

One collection may present a photo as part of a local history narrative. Another may use the same photo in a transportation theme. A teaching collection may simplify the description, while a research collection may add more precise framing.

That difference should be represented clearly.

Instead of overwriting the base item each time the item is reused, Open Collections should represent collection use as a contextual layer. That makes reuse legible. It allows the system to say:

- this is the same underlying item
- it is being used here in this specific way
- other collections may use it differently

This is important for curation because collections are not just storage containers. They are acts of selection and framing.

## 5. Keep annotations additive

Annotations should be layered on top rather than collapsed into the base item model too early.

This matters because annotations are often:

- provisional
- authored by different people
- audience-specific
- interpretive rather than definitive
- likely to grow over time

Treating annotations as additive keeps the base model simpler and allows Open Collections to support different voices and later enrichment without pretending every note is part of the core item identity.

This also creates room for future UI patterns where annotations can be shown, filtered, compared, or hidden as a separate layer.

## 6. Keep relations explicit

Relations are useful, but they should be modeled explicitly rather than hidden only in free text whenever possible.

Useful relations may include:

- same source as
- related subject
- derived from
- reused in
- annotates
- part of
- responds to

The goal is not to over-formalize this into a full graph specification.

The simpler point is that if Open Collections wants to support linking and later networked behavior, it helps to represent important connections as first-class relations instead of leaving them buried in descriptions.

Explicit relations can support:

- clearer provenance
- better navigation
- future filtering or visualization
- lightweight interoperability
- easier understanding of reuse and interpretation

## 7. A simple organizing principle

A concise organizing principle for this model is:

**Keep items reusable, keep collection use contextual, and keep annotations additive.**

A fourth helpful line is:

**Keep relations explicit when they matter.**

That principle is small enough to guide product decisions without forcing a heavy technical model too early.

## 8. Product / UX implications

This layered model suggests several useful future product directions.

Open Collections may later support:

- showing that one item is reused in multiple collections
- comparing how the same item appears in different collections
- surfacing annotations as a separate layer rather than mixing them into every item view
- showing provenance from source to item to collection use
- enabling simple relation-based navigation between related things

Just as importantly, this should remain a later layer of product richness, not the first layer of the product.

The first experience should still feel simple. Users should be able to add material, make collections, and publish without needing to understand a full network model. The layered model is valuable because it preserves conceptual clarity behind the scenes while allowing richer UX over time.

## 9. Simplicity guidance

To keep this conceptually simple, Open Collections should avoid a few common traps:

- do not make “item” do every job
- do not force all contextual information into the base item
- do not collapse annotations into core identity too early
- do not overbuild graph behavior before there is a clear product need
- start with clean separation of layers and add richer behaviors later

This is mainly a discipline of separation.

If source, item, collection use, annotation, and relation are kept distinct at the conceptual level, Open Collections can remain understandable even as reuse and linking become more powerful.

## 10. Relationship to the broader Open Collections narrative

This note fits the broader Open Collections narrative.

Open Collections is not only about storing files in one place. It is also about:

- open collections
- linked collections
- reuse
- curation
- publishing
- building on top of existing records and media

That means Open Collections should be able to work with existing source records and media, turn them into reusable items, let collections frame them for different purposes, and leave room for annotations and explicit relations to grow over time.

This supports a stronger long-term story:

- collections can build on existing sources
- curated uses do not erase provenance
- reuse stays visible rather than hidden
- interpretation can accumulate without breaking the core item model
- linking can become richer over time without making the first version too abstract

## Closing note

This should be treated as a design framing, not a finalized implementation specification.

The main proposal is simple: Open Collections should separate reusable item identity from collection-specific use, keep annotations additive, and treat meaningful links as explicit relations. That separation can support clearer product language, cleaner future UX, and a more durable open model for reuse and publishing.
