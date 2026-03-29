# Connection model assessment pass: from single-active gating to collection-assigned connections (2026-03)

Date: 2026-03-29

## Scope and intent

This note documents an architecture/product-model assessment for the connection model used by:

- `collection-account`
- `collection-manager`
- shared runtime connection foundations

This pass is intentionally **documentation and planning first**. It does **not** propose a broad implementation rewrite.

It preserves existing direction already established in the repo:

- `collection-account` is canonical connection-management UI.
- Shared runtime owns reusable connection logic/state/actions.
- `collection-manager` is a workflow consumer, not canonical owner.
- Standalone and embedded behavior both remain supported.
- Migration should be incremental and low-risk.

---

## Shift in model (framing)

### From

**Single active connection gates the current workspace**.

### To

**Multiple available connections, with collection-level connection assignment**.

This means manager workflows should no longer depend on a single global active connection to determine which collections can be viewed/managed.

---

## Files and architecture references inspected in this pass

### Governance and architecture baseline

- `AGENTS.md`
- `docs/architecture/app-shell-family-coding-standard.md`
- `docs/architecture/collection-manager-connection-migration-map.md`
- `docs/architecture/app-shell-shared-runtime-contract.md`
- `docs/architecture/collection-manager-selective-architecture-pass-2026-03.md`
- `docs/architecture/storage-model.md`

### Runtime and app implementation hotspots reviewed

- `src/shared/account/connections-context.js`
- `src/shared/account/connections-runtime.js`
- `src/apps/collection-account/src/shell.js`
- `src/apps/collection-manager/src/state/initial-state.js`
- `src/apps/collection-manager/src/app.js`
- `src/apps/collection-manager/src/controllers/collection-controller.js`
- `src/apps/collection-manager/src/controllers/workspace-controller.js`
- `src/apps/collection-manager/src/services/manifest-service.js`

---

## Current-state assessment: where single-active assumptions exist today

## 1) Shared runtime/state contract still carries active-selection semantics

- `connections-context` models `activeConnectionId` as first-class state, reinforcing a global-active concept.
- `connections-runtime.removeSource(...)` returns next `activeSourceId`, coupling removal behavior to a single current selection.
- Remembered-source restore currently focuses on restoring a source list and reconnect status, but not an explicit per-collection assignment model.

Assessment: shared runtime has good reusable connection primitives, but its exposed state still reflects active-selection-era assumptions.

## 2) `collection-account` UI/runtime model currently treats one selected connection as foreground context

- Account state tracks `activeSourceId` and updates it across create/repair/remove flows.
- List UI supports an "all" notion, but operational flows still commonly center on one selected source id.

Assessment: account is already canonical for management UX, but its state vocabulary and flows should evolve toward "available connections + selected-for-view" rather than "global active." 

## 3) `collection-manager` workflow and publish model are gated by active source filter

- Manager initial state defines `activeSourceFilter` and uses it broadly across controllers/services.
- Publish action logic requires a single resolved source; UX messaging explicitly says "Select a single active connection...".
- Collection filtering and metadata resolution often branch on `activeSourceFilter !== "all"`.
- Manifest generation filters items by selected source id and selected collection id.
- Workspace snapshot/persistence stores selected source id as part of workspace state.

Assessment: manager currently mixes two concerns:

1. useful viewport filtering by connection (keep)
2. domain gating through one global active connection (needs gradual decoupling)

## 4) Collection metadata is not yet consistently modeled as "assigned connection id"

- Item-level source association (`item.sourceId`) exists and is used heavily.
- Collection-level assignment is implicit/derived in many paths rather than explicit as canonical collection metadata.
- Local drafts exist (`localDraftCollections`) but assignment lifecycle (unassigned draft → assigned collection) is not formalized as a first-class model.

Assessment: the current state is workable, but needs an explicit collection-level connection assignment contract to reduce ambiguity.

---

## Proposed conceptual model (target)

## Connections

- Multiple connections can exist simultaneously.
- Connections are primarily treated as **available** (and potentially **enabled** later).
- Keep room for optional enabled/disabled state in future.
- Do not rely on a single global active connection for domain logic.

## Collections

- Each collection has one connection assignment (`connectionId`) **or** is temporarily unassigned.
- Unassigned is valid for draft-stage work.
- Collections are reassignable from one connection to another.

## Drafts

- Drafts can be created before destination selection.
- Draft metadata can remain unassigned until first publish/save target decision.
- Assignment can happen later without requiring draft recreation.

## Manager behavior

- Manager loads and shows collections across all available connections.
- Manager may provide local view controls (filter/group by connection) in manager UI.
- Filtering/grouping is a viewport concern, not a global active-connection gate.
- Publish/save operations resolve connection by collection assignment (or require assignment if draft is unassigned).

## Explicit out of scope for this pass

- No multi-connection mirroring/sync/publish design in this proposal.
- Future mirroring complexity may exist, but is intentionally deferred.

---

## Why this model is a better product fit

- Better supports users with multiple storage locations simultaneously.
- Better supports draft-first workflows where destination is chosen later.
- Enables collection reassignment/move scenarios without redefining global workspace state.
- Lets manager operate as a true cross-connection workflow surface.

---

## Incremental migration recommendation

## Phase 0 — Documentation + vocabulary alignment (now)

Can stay as-is initially:

- Existing runtime connection list and provider integrations.
- Existing manager/source filtering UI affordances.
- Existing account canonical management ownership.

Do first:

- Adopt terminology in docs/runtime contracts:
  - "available connections"
  - "collection connection assignment"
  - "unassigned draft"
- Clarify that manager `activeSourceFilter` is a view filter, not a domain-global active owner.

## Phase 1 — Introduce explicit collection assignment metadata

Do first:

- Add an explicit collection-level `connectionId` (nullable for drafts) in manager/runtime data handling.
- Keep compatibility with existing item/source references during transition.

Can stay as-is initially:

- Existing `item.sourceId` and provider-specific internals.
- Current UI strings/buttons where behavior is unchanged.

## Phase 2 — Decouple publish and manifest flows from global active gating

Do first:

- Resolve publish destination from selected collection assignment.
- If a selected collection is unassigned, block with an assign-destination prompt.
- Retain manager filter controls only for browsing/visibility.

Delay to later:

- Advanced regrouping UX and large UI refactors.

## Phase 3 — Update shared runtime contracts away from active-global semantics

Do first:

- Evolve shared context shape from `activeConnectionId` toward:
  - `connections[]`
  - optional `view.connectionFilter`
  - assignment-aware helpers
- Keep compatibility adapter for old `activeSourceId` call sites.

Delay to later:

- Full removal of legacy names until consumers migrate.

## Phase 4 — Enable collection reassignment

Do first:

- Introduce explicit reassignment workflow: move collection from `connectionA` to `connectionB`.
- Define operational constraints per provider capability (copy/move/update metadata semantics).

Delay to later:

- Automation/bulk reassignment UX.

## Phase 5 — Cleanup and deprecations

Do first:

- Remove legacy single-active wording and dead code paths after behavior parity.
- Consolidate docs around assignment-first model.

---

## Recommended boundaries (reaffirmed)

### `collection-account` (canonical owner)

- Owns full connection management UX and actions (add/repair/remove/reconnect).
- Surfaces available connection inventory and state.
- Does not need to be the manager’s domain gatekeeper.

### Shared runtime

- Owns connection registry/state/actions and assignment-aware helpers.
- Owns compatibility bridge during migration.
- Remains host-agnostic and usable in standalone + embedded modes.

### `collection-manager`

- Owns workflow UI and editing/publishing orchestration.
- Consumes shared connection state and collection assignment.
- Uses connection filter/group controls for visibility only.

---

## Intentionally unresolved for later phases

- Exact durable schema/location for collection-level `connectionId` across all persistence modes.
- UX specifics for reassignment conflict handling and provider capability differences.
- Bulk tooling for cross-connection moves.
- Any mirroring/multi-destination publish strategy (explicitly out of scope).

---

## Practical next step after this pass

Implement a narrow "assignment metadata + publish resolution" slice behind compatibility guards, while keeping current manager/account UI structure stable. This delivers the model shift with minimal disruption and keeps migration aligned with existing architecture direction.
