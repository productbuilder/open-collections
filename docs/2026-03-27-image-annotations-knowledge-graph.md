# Image Annotations as the Entry Point to Structured Data

OpenCollections should let contributors work visually, by placing markers on images, instead of asking them to think in ontology or knowledge graph terms.

Core interaction:
- Images act as canvases.
- Users place markers.
- Each marker represents a thing (person, place, event, organization, or object).
- Structured data is created implicitly through typed markers and links.

This keeps participation intuitive while still producing machine-readable relationships.

## Core idea

Contributors experience this as annotation. Internally, the platform can treat each marker and link as a graph-compatible relation in JSON.

---

# Core Principles

- Keep UX simple and intuitive.
- Hide complexity (no ontology/triple language in the UI).
- Use JSON as the primary storage format.
- Design for future graph compatibility.
- Separate geometry, meaning, and history.

> "Geometry lives on the image. Meaning lives on the entity. History lives in relations/events."

---

# Data Model Overview

Use a three-layer model that keeps editing simple while preserving long-term flexibility.

## 1. Image (with annotations)

- Owns marker positions and shape geometry.
- Contains an `annotations[]` array.
- Is the source of truth for where something appears in a specific image.

## 2. Entities

- Reusable records such as person, place, organization, event, and object.
- Referenced from annotations through stable IDs.
- Not tied to coordinates in any one image.

## 3. Relations / Events

- Capture historical meaning over time.
- Represent facts like founding, movement, participation, and role changes.
- Enable timeline, map, and cross-collection traversal later.

---

# Annotation Model (v1)

Use a lightweight JSON shape embedded in each image item.

```json
{
  "id": "image-001",
  "type": "image",
  "title": "Example image",
  "imageUrl": "https://example.org/images/example.jpg",
  "annotations": [
    {
      "id": "ann-1",
      "shape": "point",
      "x": 0.42,
      "y": 0.36,
      "entityType": "organization",
      "label": "Spyker",
      "targetId": "org-spyker"
    }
  ]
}
```

Notes:
- Coordinates are relative (`0` to `1`) so markers scale with different display sizes.
- Markers can exist without linked entities.
- Linking to an existing entity is optional and can happen later.

## Entity Model (example)

```json
{
  "id": "org-spyker",
  "type": "organization",
  "title": "Spyker"
}
```

---

# Why Not Store Markers on Entities

Marker positions are image-specific.

A place or person can appear in multiple images, each with different coordinates and contexts. If marker geometry is stored on entities, entity records become coupled to specific images and lose reusability.

Therefore:
- Annotation geometry belongs on image records.
- Reusable meaning belongs on entities.

---

# IIIF Compatibility Strategy

IIIF supports annotations through the W3C Web Annotation model, and this is valuable for interoperability.

However, IIIF annotation structures are heavier than needed for v1 authoring.

Recommended strategy:
- Use a simple internal annotation model first.
- Keep fields consistent enough to map later.
- Add export/transformation to IIIF when interoperability requirements justify it.

Mapping direction:
- Simple model -> transformable to IIIF later.

Do **not** implement full IIIF-native authoring as a requirement for v1.

---

# Product Insight

Users think they are:
- placing markers on images.

The system is actually:
- building a connected dataset (graph-compatible knowledge structure) through typed links.

This is the key adoption pattern: intuitive contribution on the surface, structured data under the hood.

---

# Future Extensions

- Annotation moderation workflows.
- Annotation versioning and provenance.
- Standalone annotation records (if workflow complexity grows).
- IIIF annotation export.
- Timeline and map views from linked entities/events.
- Cross-image entity linking and exploration.

---

# Summary

OpenCollections can use image annotation as a natural, low-friction interface for collecting structured and connected knowledge in JSON. Contributors get a simple workflow, while the platform remains future-ready for richer graph and interoperability layers.
