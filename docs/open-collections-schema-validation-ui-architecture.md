# Open Collections: Schema, Validation, and UI Editing Architecture

## 1. Overview

Open Collections stores **collection manifests** as JSON documents. These manifests are exchanged across UIs, APIs, importers, and publish workflows, so they must be consistently structured and machine-validated.

Today, the primary risks are:

- inconsistent manifest shapes across producers
- weak or duplicated validation logic
- user-facing editing experiences that permit invalid states

### Chosen architecture

Open Collections standardizes on a single contract pipeline:

1. **Define** manifest structure in **JSON Schema (draft 2020-12)**
2. **Enforce** that structure with **Ajv** at every system boundary
3. **Edit** manifests via **schema-driven forms** generated from the same schema

This creates one source of truth for data shape and validation behavior.

---

## 2. Core Principles

### 2.1 Schema is the source of truth

- JSON Schema is the authoritative definition of valid manifests.
- All producers and consumers rely on the same schema artifacts.
- No parallel, hand-maintained validation rules are allowed.

### 2.2 Validate at system boundaries

- Every ingress/egress boundary validates manifests.
- Invalid manifests are rejected early, with actionable errors.
- Internal services assume validated input.

### 2.3 Separate structure from semantics

- **Structure and constraints**: JSON Schema.
- **Semantic classification** (optional): schema.org metadata.
- schema.org annotations never replace validation rules.

### 2.4 UI is schema-driven

- Non-technical users edit manifests through generated forms.
- Form behavior is derived from schema constraints.
- Manual JSON editing is an advanced-only path, never default.

---

## 3. JSON Schema Strategy

### Why JSON Schema

- industry-standard format for JSON contracts
- broad tooling support (validation, IDE support, codegen)
- compatible with OpenAPI ecosystems and API governance practices
- declarative and language-agnostic

### Why draft 2020-12

- modern, stable draft with strong ecosystem support
- improved composition and reuse capabilities
- suitable for long-term schema evolution and modularization

### What the schema defines

Schemas must define at least:

- object types and property types
- required fields
- enums and literals
- string/number/array/object constraints
- reusable definitions via `$defs` and `$ref`
- additional property behavior (`additionalProperties` policy)

Example:

```json
{
  "type": "object",
  "required": ["id", "title", "items"],
  "properties": {
    "id": { "type": "string" },
    "title": { "type": "string" },
    "items": {
      "type": "array",
      "items": { "$ref": "#/$defs/item" }
    }
  }
}
```

Recommended baseline manifest shape additions:

- `$schema`: JSON Schema dialect URI
- `$schemaVersion`: manifest schema version contract used for validation

---

## 4. Schema Package Design

Create a dedicated package:

`@open-collections/collector-schema`

### Responsibilities

- publish canonical JSON Schema files
- export Ajv-ready compiled validator functions
- optionally export generated TypeScript types
- manage schema version metadata and migration helpers

### Suggested package layout

```text
packages/collector-schema/
  schemas/
    collection-manifest.v1.schema.json
    collection-manifest.v2.schema.json
  validators/
    v1.js
    v2.js
  types/
    v1.d.ts
    v2.d.ts
  migrations/
    v1-to-v2.js
  index.js
```

### Design rules

- schemas are immutable once released
- new incompatible contracts require a new major schema version
- validators are built from published schema artifacts, not custom logic

---

## 5. Validation Architecture (Ajv)

Ajv is the runtime validator for all manifest checks. It evaluates JSON against JSON Schema keywords and returns either success or detailed errors.

### Validation flow

```text
JSON Input → Ajv Validator → Valid / Error → Continue / Reject
```

### Where Ajv runs

- client-side pre-submit checks in schema-driven editor flows
- server/API boundary validation
- provider ingestion and publish pipeline validation

### Runtime behavior

- **strict mode enabled** to prevent ambiguous schema behavior
- **fail fast by boundary** (reject payload on validation failure)
- **structured error reporting** including path and violated rule

### Error contract (recommended)

```json
{
  "code": "MANIFEST_VALIDATION_FAILED",
  "schemaVersion": "2.1.0",
  "errors": [
    {
      "path": "/items/0/id",
      "keyword": "required",
      "message": "must have required property 'id'"
    }
  ]
}
```

---

## 6. Enforcement Points

Validation is mandatory at all ingestion and exchange boundaries.

### 6.1 Provider layer

Applies to providers such as GitHub, Google Drive, and local filesystem import.

- validate on read/import
- reject invalid manifests before persistence

### 6.2 API layer

- validate request payloads on create/update endpoints
- validate outgoing manifest payloads if transformed

### 6.3 CLI and ingestion pipelines

- validate batch inputs before processing
- fail job/unit with per-file diagnostics

### Enforcement policy

> Invalid manifests **never** enter canonical storage or publish output.

---

## 7. UI Editing Strategy

The default editor is a schema-driven form UI, generated from JSON Schema and UI metadata.

### Mapping from schema to form controls

- `type: "string"` → text input
- `type: "number"` / `integer` → numeric input
- `enum` → select/dropdown
- `required` → required marker + submit blocking
- arrays → repeatable item sections
- object nesting → grouped panels/sections

### UX constraints

- users do not edit raw JSON by default
- inline validation feedback is shown from Ajv errors
- submit/publish actions are blocked until valid

### Why this model

- lower user error rate
- consistent editing behavior across apps
- faster onboarding for non-technical users
- reduced divergence between UI and backend validation

---

## 8. Optional: schema.org Integration

schema.org can be added as an optional semantic overlay, for example to indicate domain concepts like `Product`, `Person`, or `Dataset`.

Rules:

- schema.org metadata is descriptive, not authoritative
- JSON Schema remains the only validation contract
- semantic fields may be validated as plain JSON properties via JSON Schema rules

---

## 9. Versioning Strategy

### Version marker

Each manifest must include a version indicator (for example `$schemaVersion`) tied to a released schema contract.

### Compatibility policy

- backward-compatible changes: minor version
  - additive optional fields
  - relaxed constraints where safe
- breaking changes: major version
  - renamed/removed required fields
  - stricter incompatible constraints

### Migration strategy

- provide explicit migrators between major versions
- validate both pre- and post-migration payloads
- keep previous major validators available during transition windows

ASCII overview:

```text
v1 manifest --(migrate v1→v2)--> v2 manifest --(Ajv v2 validate)--> stored/published
```

---

## 10. Example End-to-End Flow

```text
[User edits collection in form]
          ↓
[Form model produces manifest JSON]
          ↓
[Ajv validates against schema version N]
      ├── valid   → store + publish
      └── invalid → show errors, block save/publish
```

Step-by-step:

1. User edits a collection in a schema-driven UI.
2. UI serializes current form state into manifest JSON.
3. Ajv validates the JSON against the selected schema version.
4. If valid, manifest is persisted and can be published.
5. If invalid, the operation is rejected with actionable field-level errors.

---

## 11. Tradeoffs and Alternatives

### Why not custom validation logic only

- duplicates contract logic across services
- hard to keep behavior consistent
- higher maintenance and defect risk

### Why not schema.org alone

- schema.org is semantic vocabulary, not a strict validation engine
- insufficient for enforcement of required structural constraints

### Why not raw JSON editing by default

- high error rate for non-technical users
- inconsistent data quality
- poor usability and slower workflows

### Accepted tradeoff

Schema-driven forms can constrain flexibility for advanced users. This is intentional for default flows; advanced raw JSON editing can remain an explicitly gated expert feature with full Ajv validation.

---

## Decision Summary

Open Collections will implement a **schema-first architecture**:

- JSON Schema (draft 2020-12) is the canonical contract.
- Ajv enforces the contract at every boundary.
- UI editing is generated from the same schema.
- schema.org is optional semantics, never validation authority.

This yields consistent manifests, predictable validation, and a safer editing experience across the platform.
