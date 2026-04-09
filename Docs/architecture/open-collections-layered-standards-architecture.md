# Open Collections: Layered Standards Architecture

## 1. Overview

Open Collections publishes and manages structured JSON data for cultural heritage collections. The platform needs to satisfy three practical requirements at the same time:

- **Validation**: data must be structurally correct and enforceable at ingest and publish boundaries.
- **Interoperability**: data should align with widely used heritage and web standards.
- **Usability**: cataloging and editing should be form-driven, not dependent on hand-editing raw JSON.

To meet these requirements without overengineering, Open Collections uses a **layered standards architecture**:

- A strict **core contract** for structure and validation.
- A semantic baseline for shared meaning.
- Optional extensions for media and controlled vocabularies.
- Optional outbound mappings for broader ecosystem compatibility.

---

## 2. Core Principles

1. **JSON Schema is the single source of truth for structure.**  
   The canonical schema defines what shape of JSON is accepted.

2. **Structure and semantics are separated.**  
   JSON Schema enforces structure; Dublin Core/SKOS/schema.org/CIDOC CRM define meaning.

3. **Validation happens at system boundaries.**  
   Inbound and outbound payloads are validated before persistence, indexing, or publication.

4. **Progressive enhancement over big-bang modeling.**  
   Start with a minimal schema + Dublin Core baseline; add IIIF, SKOS, schema.org, and CIDOC mappings incrementally.

5. **Interoperability by alignment, not strict internal adoption.**  
   Open Collections keeps an internal JSON model and maps outward to external standards where valuable.

---

## 3. Layered Architecture

```text
+--------------------------------------------------------------+
| Interoperability Layer                                       |
|  - schema.org (web/SEO mapping)                             |
|  - CIDOC CRM (advanced heritage mapping target)             |
+--------------------------------------------------------------+
| Extension Layer                                              |
|  - IIIF (media interoperability: image APIs/manifests)      |
|  - SKOS (controlled vocabularies/taxonomies)                |
+--------------------------------------------------------------+
| Semantic Layer                                               |
|  - Dublin Core (base descriptive semantics)                 |
+--------------------------------------------------------------+
| Core Layer                                                   |
|  - JSON Schema draft 2020-12 (structure + validation)       |
+--------------------------------------------------------------+
```

### Layer responsibilities

- **Core Layer (JSON Schema)**: defines required fields, value types, enums, nested structures, and constraints.
- **Semantic Layer (Dublin Core)**: defines shared meaning of descriptive fields (e.g., title, creator, rights).
- **Extension Layer**:
  - **IIIF** for interoperable media references and manifests.
  - **SKOS** for controlled subject/tag values represented as concepts.
- **Interoperability Layer**:
  - **schema.org** for web discoverability.
  - **CIDOC CRM** as an advanced external mapping model for institutions that need richer ontology alignment.

---

## 4. JSON Schema (Core Contract)

Open Collections uses **JSON Schema draft 2020-12** as the canonical contract.

### What JSON Schema is used for

- **Validation** in services and APIs (e.g., via Ajv).
- **Documentation** of expected payloads.
- **UI generation** for data-entry forms.

### Boundary enforcement

- Invalid JSON payloads are rejected at ingest/update/publish boundaries.
- Only schema-valid data is persisted and published.

### Example schema snippet

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://open-collections.org/schema/collection-item.json",
  "title": "Collection Item",
  "type": "object",
  "required": ["id", "title", "type"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uri"
    },
    "type": {
      "type": "string",
      "enum": ["PhysicalObject", "Image", "Document", "AudioVisual"]
    },
    "title": {
      "type": "string",
      "minLength": 1
    },
    "creator": {
      "type": "array",
      "items": { "type": "string" }
    },
    "date": {
      "type": "string",
      "description": "Human-readable or ISO-8601 date expression"
    },
    "rights": {
      "type": "string"
    },
    "media": {
      "type": "object",
      "properties": {
        "type": { "type": "string" },
        "manifest": { "type": "string", "format": "uri" }
      },
      "additionalProperties": true
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "label"],
        "properties": {
          "id": { "type": "string", "format": "uri" },
          "label": { "type": "string" }
        }
      }
    }
  },
  "additionalProperties": false
}
```

---

## 5. Dublin Core (Base Semantics)

Dublin Core provides a compact, widely recognized baseline for descriptive metadata semantics.

Typical aligned fields include:

- `title`
- `creator`
- `subject`
- `description`
- `publisher`
- `date`
- `format`
- `identifier`
- `source`
- `language`
- `rights`

### Role in Open Collections

- Dublin Core is a **semantic baseline** for field meaning and naming conventions.
- It is **not** used as a validator.
- JSON Schema still defines whether fields are required, their types, and allowed shapes.
- Projects can extend beyond Dublin Core when collection-specific needs require it.

---

## 6. IIIF (Media Layer)

IIIF enables interoperable image and media delivery using JSON/JSON-LD resources and APIs.

### Why IIIF matters here

- Supports deep-zoom and tiled image viewers.
- Provides standardized manifest-based media packaging.
- Reduces lock-in with custom media metadata formats.

### Open Collections usage model

- Keep item metadata in Open Collections JSON.
- Reference externally hosted IIIF manifests/canvases as media descriptors.
- Treat IIIF as an extension for media interoperability, not the core item schema model.

### Example

```json
{
  "media": {
    "type": "iiif",
    "manifest": "https://example.org/iiif/manifest.json"
  }
}
```

Reference: [IIIF JSON-LD Implementation Notes][1].

---

## 7. SKOS (Vocabulary Layer)

SKOS is used to represent controlled vocabularies and taxonomies as linked data.

### Why SKOS matters here

- Concepts have stable identifiers (URIs).
- Concepts expose human-readable labels.
- Supports hierarchical relationships (`broader`, `narrower`) and related concepts.

### Open Collections usage model

Use SKOS-style concept references for:

- tags
- subjects
- classification fields

Store concept references in item JSON as `{id, label}` (with optional scheme metadata), while vocabulary management can remain external.

### Example

```json
{
  "tags": [
    {
      "id": "http://vocab.getty.edu/aat/300033618",
      "label": "painting"
    }
  ]
}
```

Reference: [Simple Knowledge Organization System (SKOS)][2].

---

## 8. Optional Interoperability Layers

### schema.org

- Used as an **outbound mapping target** for web/search ecosystem compatibility.
- Useful for JSON-LD snippets, indexing pipelines, and SEO-oriented publication.
- Not used as a primary internal validation schema.

### CIDOC CRM

- Treated as an **advanced ontology mapping target** for institutions with deep semantic integration needs.
- Not implemented as the internal authoring model.
- Mappings can be generated from validated Open Collections records when required.

---

## 9. UI Editing Architecture

Open Collections uses schema-driven forms for editing.

### Design

- UI forms are generated from JSON Schema.
- Users edit through structured controls, not raw JSON by default.
- The schema drives:
  - field type widgets
  - required indicators
  - enum/select controls
  - nested object/array editors

### Optional UI schema

A separate UI-schema layer may be used for presentation concerns:

- field order/grouping
- widget overrides
- help text and localized labels
- conditional UI behaviors

This UI schema must not redefine validation rules that belong to JSON Schema.

---

## 10. End-to-End Flow

```text
1) Define/Version JSON Schema
        |
2) Generate Form UI from Schema (+ optional UI schema)
        |
3) User edits metadata
        |
4) Validate payload with Ajv (JSON Schema 2020-12)
        |
5) Reject invalid / accept valid
        |
6) Store + index + publish
        |
7) Optional outbound mappings:
      - IIIF links for media presentation
      - schema.org JSON-LD for web
      - CIDOC CRM export for advanced partners
```

### Example flow payload (valid)

```json
{
  "id": "https://data.example.org/object/123",
  "type": "Image",
  "title": "Portrait of a Merchant",
  "creator": ["Unknown"],
  "date": "c. 1760",
  "rights": "CC BY 4.0",
  "media": {
    "type": "iiif",
    "manifest": "https://media.example.org/iiif/object-123/manifest.json"
  },
  "tags": [
    {
      "id": "http://vocab.getty.edu/aat/300033618",
      "label": "painting"
    }
  ]
}
```

---

## 11. Tradeoffs and Non-Goals

### Tradeoffs

- **JSON Schema-first** improves reliability and tooling, but requires careful schema versioning discipline.
- **External semantic alignment** keeps the model pragmatic, but some semantic richness is deferred to mappings.
- **Schema-driven UI** accelerates delivery and consistency, with less hand-crafted UX flexibility initially.

### Non-goals

- Not implementing CIDOC CRM as the primary internal data model.
- Not using schema.org as a validation mechanism.
- Not making raw JSON editing the primary authoring experience.

---

## 12. Future Evolution

The architecture is designed for incremental expansion:

- **CIDOC CRM mapping pipeline** for advanced institutional integrations.
- **Richer SKOS integration** (concept schemes, multilingual labels, hierarchy-aware browsing).
- **Deeper IIIF support** (canvas ranges, annotations, derivatives).
- **Linked data publication options** via JSON-LD contexts where needed.
- **Schema modularization** (core + domain extensions) with explicit semantic profiles.

This preserves a stable core contract while enabling higher interoperability maturity over time.

---

## Appendix A: Standards Positioning (Quick Reference)

| Standard | Primary Role | In Open Collections | Validation Authority |
|---|---|---|---|
| JSON Schema (2020-12) | Structure and constraints | Canonical internal contract | **Yes** |
| Dublin Core | Descriptive semantics | Baseline field meaning | No |
| IIIF | Media interoperability | Linked media manifests/APIs | No (except via local schema rules) |
| SKOS | Controlled vocabularies | Concept-based tags/subjects | No (except via local schema rules) |
| schema.org | Web interoperability | Outbound mapping/JSON-LD | No |
| CIDOC CRM | Heritage ontology | Advanced mapping target | No |

---

## Appendix B: Minimal Mapping Sketch

```json
{
  "openCollections": {
    "title": "Portrait of a Merchant",
    "creator": ["Unknown"],
    "date": "c. 1760",
    "tags": [
      {
        "id": "http://vocab.getty.edu/aat/300033618",
        "label": "painting"
      }
    ]
  },
  "semanticAlignment": {
    "dublinCore": {
      "title": "dc:title",
      "creator": "dc:creator",
      "date": "dc:date"
    },
    "schemaOrg": {
      "title": "schema:name",
      "creator": "schema:creator",
      "date": "schema:dateCreated"
    }
  }
}
```

This sketch illustrates alignment intent only; JSON Schema remains the enforcement contract.

[1]: https://iiif.io/api/annex/notes/jsonld/?utm_source=chatgpt.com "JSON-LD Implementation Notes — IIIF | International Image Interoperability Framework"
[2]: https://en.wikipedia.org/wiki/Simple_Knowledge_Organization_System?utm_source=chatgpt.com "Simple Knowledge Organization System"
