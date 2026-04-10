# Reusable Schema Platform Architecture (RFC)

## 1. Overview

Open Collections needs a schema platform that is reusable across products, domains, and runtime contexts—not a one-off model tied to a single app.

This architecture treats Open Collections as a primary consumer, but not the only consumer. The platform must support any JSON-based contract, including future systems outside Open Collections.

The design is intentionally opinionated around canonical roles:

- **Definition** defines contracts.
- **Validation** enforces contracts.
- **UI forms** operationalize contracts for humans.
- **Semantic alignment** maps meaning for interoperability (optional).

This separation keeps responsibilities clear, reduces coupling, and makes schemas portable across APIs, tooling, and user-facing editors.

---

## 2. Design Principles

1. **Single responsibility per subsystem**  
   Each layer has one canonical job and explicit non-goals.

2. **Schema as source of truth**  
   JSON Schema (draft 2020-12) is the authoritative contract for structure and constraints.

3. **Validation at boundaries**  
   All ingress/egress boundaries validate payloads; invalid JSON never crosses trust boundaries.

4. **UI operationalizes schema**  
   The form layer consumes schema contracts and helps users produce valid JSON.

5. **Semantic alignment is optional and non-authoritative**  
   Dublin Core/schema.org/SKOS/IIIF/CIDOC CRM mappings add meaning, not structural validation.

6. **Multiple schemas are first-class**  
   The platform must handle many schema families and domains equally.

7. **Explicit identity and versioning**  
   Every schema has a stable ID and explicit version semantics.

---

## 3. System Decomposition

### A. Schema Definition Layer

**Canonical role:** defines contracts.

**Responsibilities**

- Author and store JSON Schema documents.
- Assign and manage schema IDs.
- Manage schema versioning lifecycle.
- Manage `$ref` cross-schema references.
- Store optional metadata (purpose, owner, domain, deprecation status).

**Non-responsibilities**

- Runtime validation execution.
- UI rendering behavior.

**Suggested names**

- `schema-definitions`
- `schema-registry`
- `schema-core`

### B. Validation Layer

**Canonical role:** enforces contracts.

**Responsibilities**

- Load/register schemas from the registry.
- Compile validators using Ajv.
- Validate JSON instances by schema ID.
- Return normalized validation results.
- Enforce validation at system boundaries.

**Non-responsibilities**

- Schema authoring/version governance.
- UI layout or rendering concerns.

**Suggested names**

- `schema-validation`
- `validation-engine`
- `schema-validator`

### C. UI Form Layer

**Canonical role:** operationalizes contracts for human editing.

**Responsibilities**

- Render forms from schema definitions.
- Bind user input to JSON instance data.
- Display validation feedback.
- Produce valid JSON output suitable for boundary checks.
- Support optional UI layout metadata (labels, grouping, ordering, widgets).

**Non-responsibilities**

- Schema authoring governance.
- Canonical enforcement outside editor contexts.

**Suggested names**

- `schema-forms`
- `schema-editor`
- `schema-ui`

### D. Semantic Alignment Layer (Optional)

**Canonical role:** maps contracts to external semantic vocabularies.

**Responsibilities**

- Map fields to Dublin Core, schema.org, SKOS, IIIF, CIDOC CRM, etc.
- Support interoperability exports and linked-data alignment.
- Document semantic intent for downstream integrators.

**Non-responsibilities**

- Validation authority.
- UI authority.

**Suggested names**

- `schema-semantics`
- `metadata-mappings`
- `ontology-alignment`

---

## 4. Layer Relationships

```text
[Schema Definition Layer]
        |
        v
[Validation Layer] <------ used by APIs, publishing, import, CLI
        |
        v
[UI Form Layer]
        |
        v
   Valid JSON Output

[Semantic Alignment Layer]
        |
        +----> annotates and maps meaning, but does not validate
```

Interaction rules:

- The **Validation Layer** consumes schemas from the **Definition Layer** and is the enforcement point.
- The **UI Form Layer** consumes the same schemas for editing UX and may call the Validation Layer for immediate feedback.
- The **Semantic Alignment Layer** references definitions and/or instances to add mappings, but cannot overrule schema constraints.

---

## 5. Schema Identity and Registry Model

Explicit schema identity is mandatory. All systems operate by `schemaId`, never by hardcoded entity logic.

Example schema IDs:

- `open-collections.collection`
- `open-collections.item`
- `heritage.institution`
- `common.person`

Conceptual APIs:

```ts
getSchema(schemaId)
validate(schemaId, data)
renderForm(schemaId, data)
```

Identity model guidance:

- `schemaId` is stable across minor revisions.
- Version is explicit (e.g., semver or date-based policy).
- Registry resolves `(schemaId, version)` to a concrete schema artifact.
- Consumers declare schema compatibility explicitly.

---

## 6. Schema Definition Layer Design

This layer owns canonical contract artifacts.

### What belongs here

- JSON Schema files (draft 2020-12).
- Registry/manifest entries.
- Version metadata.
- Cross-schema references (`$ref`).
- Optional descriptive metadata (`title`, `description`, owner, status).

### Example file layout

```text
schemas/
  open-collections/
    collection.schema.json
    item.schema.json
  heritage/
    institution.schema.json
  common/
    person.schema.json
```

### Example registry structure

```json
{
  "schemas": [
    {
      "schemaId": "open-collections.collection",
      "version": "1.2.0",
      "path": "schemas/open-collections/collection.schema.json",
      "status": "active"
    },
    {
      "schemaId": "common.person",
      "version": "1.0.0",
      "path": "schemas/common/person.schema.json",
      "status": "active"
    }
  ]
}
```

Why this is the source of truth:

- Downstream logic should derive behavior from schema contracts, not duplicated rule code.
- One canonical definition path prevents drift between API, UI, and pipeline assumptions.

---

## 7. Validation Layer Design

Ajv is the runtime enforcement engine for JSON Schema draft 2020-12.

### Core design

- **Schema registration:** register all active schemas and references.
- **Compilation:** compile once per `(schemaId, version)` and reuse.
- **Strict mode:** run Ajv in strict mode to surface schema quality issues early.
- **Caching:** cache compiled validators for low-latency validation.
- **Error normalization:** transform Ajv error output into stable, consumer-friendly shape.

### Validation result contract

```ts
type ValidationError = {
  path: string
  keyword: string
  message: string
  params?: Record<string, unknown>
}

type ValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[] }
```

### Boundary enforcement points

Validate at all boundaries:

- import pipelines
- publish operations
- API create/update endpoints
- async processing pipelines
- CLI tooling and automation

**Rule:** Invalid JSON must not cross system boundaries.

---

## 8. UI Form Layer Design

The UI layer provides a generic schema-driven editor for multiple schema IDs.

### Core model

- One editor shell supports many schemas.
- Form structure is generated from JSON Schema constraints.
- Schema informs input types, required fields, enums, arrays, nested objects, and cardinality.
- Optional `uiSchema` improves presentation without changing contract semantics.

### Contract vs presentation

- **Schema = contract** (authoritative structure + validation constraints).
- **UI schema = presentation** (labels, layout, widget hints, grouping).

### Conceptual editor input

```ts
type EditorDefinition = {
  schemaId: string
  data: unknown
  uiSchema?: unknown
}
```

### Practical behavior

- Inline validation feedback should reuse Validation Layer semantics.
- Save actions should still run authoritative boundary validation.
- UI must not invent rules that conflict with the canonical schema.

---

## 9. Semantic Alignment Layer

This layer is optional and additive.

### Purpose

Align internal fields with external vocabularies for interoperability, federation, and export.

### Typical mappings

- **Dublin Core** for baseline heritage metadata semantics.
- **IIIF** for image/media resource interoperability.
- **SKOS** for controlled vocabulary concepts.
- **schema.org** for web discoverability.
- **CIDOC CRM** as a higher-fidelity heritage mapping target.

### Boundary

- Semantic standards are interoperability tools.
- They do **not** replace JSON Schema as structural contract and validation authority.

---

## 10. Example Package / Module Architecture

Generic-first package structure:

- `@your-org/schema-definitions`
- `@your-org/schema-validation`
- `@your-org/schema-forms`
- `@your-org/schema-semantics`

Open Collections consumer example:

- `@open-collections/schema-definitions` (Open Collections schemas + shared common schemas)
- `@open-collections/schema-validation` (Ajv-based validation services used by APIs/CLI/import/publish)
- `@open-collections/schema-forms` (generic editor shell used in app-shell family apps)
- `@open-collections/schema-semantics` (export mappings for linked/open metadata workflows)

Package dependency direction:

```text
schema-definitions --> schema-validation --> schema-forms
         |
         +---------------------------> schema-semantics (optional)
```

---

## 11. Canonical Responsibilities Summary

| Layer | Canonical role | Owns | Does not own |
|---|---|---|---|
| Schema Definition | Defines contracts | JSON Schema artifacts, IDs, versions, refs, registry metadata | Runtime enforcement, UI rendering |
| Validation | Enforces contracts | Ajv integration, compilation, cache, normalized results, boundary checks | Schema authoring, UI layout |
| UI Form | Operationalizes contracts | Schema-driven editing UX, data binding, inline feedback, JSON output | Contract authority, non-UI boundary enforcement |
| Semantic Alignment (Optional) | Maps meaning | Vocabulary mappings, export/interoperability semantics | Validation authority, UI authority |

---

## 12. End-to-End Flow

1. A schema is authored in the Definition Layer.
2. The schema is registered with explicit `schemaId` and version.
3. The Validation Layer loads and compiles the schema via Ajv.
4. The UI Form Layer renders an editor for that `schemaId`.
5. A user edits data through schema-driven controls.
6. Validation checks run and return normalized results.
7. Valid JSON is accepted for publish/storage/API continuation.
8. Optional semantic mappings are applied for export/interoperability channels.

---

## 13. Non-Goals

- Building one-off validators per entity type.
- Making semantic standards authoritative for structural validation.
- Making raw JSON editing the primary end-user workflow.
- Coupling schema infrastructure to only one product domain.

---

## 14. Recommendations

1. Adopt JSON Schema draft 2020-12 platform-wide as contract standard.
2. Treat schema IDs and versions as first-class runtime concepts.
3. Centralize Ajv-based validation in one reusable validation module.
4. Build one generic schema-driven form platform that supports multiple schema IDs.
5. Keep semantic mapping as a separate optional concern, not a core validation dependency.

