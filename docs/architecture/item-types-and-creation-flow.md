# Item Types and Creation Flow

## Relationship to earlier docs

This note extends [`Items, Structure, and Interfaces`](./items-structure-and-interfaces.md) and [`Progressive Structure and Adoption Model`](./progressive-structure-and-adoption-model.md).

Those notes define the broader item model, structural dimensions, and progressive adoption approach; this note defines the required type layer and its role in creation flow and interface behavior.

## Overview

Every item in Open Collections requires a primary `type`.

Type is the minimum answer to the question “What kind of item is this?”, which keeps the entry model simple while enabling stronger interface behavior across collection views.

## Core rule

Every item must have exactly one primary top-level `type`.

This is the minimum required classification for an item, while additional detail can be added progressively through subtype, title, description, relations, location, time, context, and media.

## Basis list of item types

```json
[
  "thing",
  "person",
  "organization",
  "location",
  "event",
  "narrative",
  "media"
]
```

- `thing` → physical or digital entities, including objects, plants, animals, artifacts, and documents.
- `person` → individual humans.
- `organization` → institutions, groups, companies, and collectives.
- `location` → places, sites, buildings, regions, and landmarks.
- `event` → things that happen in time.
- `narrative` → stories, interpretations, and contextual records.
- `media` → media assets when the media itself is the item.

The basis list is a stable practical foundation for product and interface behavior, not a complete philosophical ontology.

## Type as the first answer to “what”

`item.type` answers the broadest “what” question: what kind of item is this?

It is the first level of identity rather than the full description, and further detail can be added later through subtype, title, description, subject, material, relations, context, and media.

## Type in creation flow

Selecting a type should be one of the first required steps when creating a new item.

A practical creation flow is:

1. select item type
2. add title or label
3. optionally add media
4. optionally add additional structure such as location, time, relations, and context

This supports low-friction entry while grounding every item in a clear primary identity.

## Type in the interface

Type should always be visible in the interface.

Each item type should have a label and an icon, and both should be clearly visible on item cards.

This improves scanning, helps users learn the model, strengthens recognition in mixed collections, and keeps behavior consistent across views.

## Item card requirements

Item cards should always show:

- type icon
- type label
- item title / label

Type should not be hidden or only implicit, because immediate visibility helps users understand what they are looking at.

## Type-aware filtering, ordering, and grouping

Because every item has a required type, the system can support filtering by type, grouping by type, ordering by type, and type-aware defaults in forms and interfaces.

This is especially useful in mixed collections where different kinds of items need clear organization and fast interpretation.

## Simplicity and progressive structure

This stays aligned with the progressive model: type is required, and everything else is optional.

Requiring one type keeps the base model clear without making it heavy, while allowing progressive enrichment as collections mature.

**Type is required. Structure is optional.**

## JSON examples

### Example 1: minimal item

```json
{
  "id": "item-001",
  "type": "person",
  "title": "Piet Mondriaan"
}
```

### Example 2: thing with more detail

```json
{
  "id": "item-002",
  "type": "thing",
  "subtype": "helmet",
  "title": "Bronze helmet"
}
```

### Example 3: location item

```json
{
  "id": "item-003",
  "type": "location",
  "subtype": "house",
  "title": "Villa Heideheuvel"
}
```

### Example 4: media item

```json
{
  "id": "item-004",
  "type": "media",
  "subtype": "photograph",
  "title": "Portrait of a family"
}
```

## Summary

Every item needs one primary type, type is the first answer to “what,” type should be selected early in creation, type should always be visible in cards and UI, and type enables filtering, ordering, and clearer understanding of collections.

Type makes the item legible.
