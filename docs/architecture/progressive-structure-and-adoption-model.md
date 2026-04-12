# Progressive Structure and Adoption Model

## Relationship to `Items, Structure, and Interfaces`

This document extends [`Items, Structure, and Interfaces`](./items-structure-and-interfaces.md).

The earlier note defines the full conceptual model and how interfaces emerge from structure. This companion note focuses on adoption: how people can start simply, add structure progressively, and keep the user-facing experience lightweight.

## Overview

Open Collections starts from items as the common base unit. Structure is added only when needed, and users should not need to understand the full model upfront.

**Start with items. Add structure when needed.**

## Core principle

**The model is rich, but the entry point is simple.**

The overall architecture supports multiple dimensions, interfaces, and exploratory views across LinkedCollections, Collector, Browser, and related visual explorers. But initial use should stay lightweight: a user can create useful items without adopting the full structure from day one.

## Levels of structure

The model can be introduced as progressive levels.

### Level 1 — Minimal Item

```json
{
  "id": "item-001",
  "title": "Bronze helmet",
  "description": "Ancient bronze helmet with cheek guards.",
  "media": [
    {
      "type": "image",
      "url": "https://example.org/images/helmet.jpg"
    }
  ]
}
```

No structural data is required. This works in collection and detail views and is the easiest adoption entry point.

### Level 2 — Spatial and Temporal Structure

```json
{
  "location": {
    "name": "Rome",
    "lat": 41.9028,
    "lon": 12.4964
  },
  "time": {
    "label": "5th century BCE",
    "start": "-0500-01-01",
    "end": "-0400-12-31"
  }
}
```

Adding location and time unlocks map and timeline interfaces. These additions are intuitive, low-friction, and provide immediate visual payoff.

### Level 3 — Relational Structure

```json
{
  "actors": [
    {
      "id": "person-001",
      "type": "person",
      "name": "Unknown maker",
      "role": "creator"
    }
  ],
  "relations": [
    {
      "type": "createdBy",
      "target": "person-001"
    },
    {
      "type": "relatedTo",
      "target": "item-002"
    }
  ]
}
```

Actors and relations unlock network view, introduce explicit connections between items, and remain optional.

### Level 4 — Contextual Structure

```json
{
  "context": {
    "summary": "Likely used in ceremonial settings rather than active combat.",
    "themes": ["ritual", "status", "warfare"],
    "narrative": "Part of a broader group of ceremonial bronze artifacts connected to symbolic display."
  }
}
```

Context supports narrative and board interfaces by adding interpretation, framing, and meaning.

### Level 5 — Full Model

```json
{
  "classification": {
    "category": "artifact",
    "type": "helmet",
    "materials": ["bronze"],
    "subjects": ["military", "ceremonial"]
  },
  "annotations": [
    {
      "id": "annotation-001",
      "target": {
        "media": "https://example.org/models/helmet.glb",
        "selector": "hotspot:crest"
      },
      "body": "Attachment point for the decorative crest."
    }
  ]
}
```

Classification and annotations support richer descriptive and interpretive use cases, but they are not required for basic adoption.

## Five dimensions as optional layers

This model stays compatible with the five dimensions from the earlier architecture note:

- **what** = classification / identity
- **where** = location
- **when** = time
- **who** = actors / relations
- **why** = context

These dimensions should be treated as optional structural layers, not required sections every user must understand upfront.

## Interface unlock model

Interfaces should not be chosen manually first. Instead, they become available when the corresponding structure is present.

| data added | interface unlocked |
|---|---|
| none | collection |
| location | map |
| time | timeline |
| relations | network |
| context | narrative |

As data is added, the same items can be explored through more interfaces.

## User experience principles

- do not require upfront structure
- start from content
- suggest structure progressively
- reveal complexity on demand
- keep schema separate from UX

The schema can be structured while the user experience still feels like just adding information.

## Data model layers

A practical layered view:

- **item (base)** = identity, title, description
- **representation** = media (image, video, IIIF, 3D, etc.)
- **structural layers** = location, time, relations, context
- **overlay layer** = annotations

Classification belongs to item identity and descriptive meaning (`what`), while media belongs to representation.

## Full example object

```json
{
  "id": "item-001",
  "title": "Bronze helmet",
  "description": "Ancient bronze helmet with cheek guards.",

  "classification": {
    "category": "artifact",
    "type": "helmet",
    "materials": ["bronze"],
    "subjects": ["military", "ceremonial"]
  },

  "media": [
    {
      "type": "image",
      "url": "https://example.org/images/helmet.jpg"
    },
    {
      "type": "iiif",
      "manifest": "https://example.org/iiif/helmet/manifest.json"
    },
    {
      "type": "model",
      "format": "model/gltf-binary",
      "url": "https://example.org/models/helmet.glb"
    }
  ],

  "location": {
    "name": "Rome",
    "lat": 41.9028,
    "lon": 12.4964
  },

  "time": {
    "label": "5th century BCE",
    "start": "-0500-01-01",
    "end": "-0400-12-31"
  },

  "actors": [
    {
      "id": "person-001",
      "type": "person",
      "name": "Unknown maker",
      "role": "creator"
    },
    {
      "id": "org-001",
      "type": "organization",
      "name": "National Museum",
      "role": "holder"
    }
  ],

  "relations": [
    {
      "type": "createdBy",
      "target": "person-001"
    },
    {
      "type": "heldBy",
      "target": "org-001"
    },
    {
      "type": "relatedTo",
      "target": "item-002"
    }
  ],

  "context": {
    "summary": "Likely used in ceremonial settings rather than active combat.",
    "themes": ["ritual", "status", "warfare"],
    "narrative": "This object is part of a broader group of ceremonial bronze artifacts connected to elite status and symbolic display."
  },

  "annotations": [
    {
      "id": "annotation-001",
      "target": {
        "media": "https://example.org/models/helmet.glb",
        "selector": "hotspot:crest"
      },
      "body": "Attachment point for the decorative crest."
    },
    {
      "id": "annotation-002",
      "target": {
        "media": "https://example.org/images/helmet.jpg",
        "selector": "xywh=220,80,140,120"
      },
      "body": "Visible surface damage on the left cheek guard."
    }
  ]
}
```

## Reading the example

- base item → `id`, `title`, `description`
- what → `classification`
- where → `location`
- when → `time`
- who → `actors`, `relations`
- why → `context`
- representations → `media`
- overlays → `annotations`

Not every item needs all fields. This example shows the full model; real items can start much smaller and grow over time.

## Summary

- items are the foundation
- structure is optional and additive
- interfaces emerge from structure
- complexity is progressive, not required

**Items first. Structure later. Interfaces emerge automatically.**
