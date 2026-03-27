# Collection Manager → Collection Account: Connection Management Migration Map

Date: 2026-03-27

## Scope and intent

This note audits where connection/account management currently lives in `collection-manager`, defines target ownership, and proposes an incremental migration path that keeps manager behavior stable during transition.

This is **not** a rewrite plan and does **not** introduce a duplicate `collection-manager-v2`.

## Migration status update (current cleanup step)

The manager cleanup has advanced to an account-first posture for connection entry points in embedded/shell mode:

- Legacy manager top header chrome has been removed from the global app shell position. Connection/workflow actions now live in manager-local browser toolbar UI.
- Embedded manager no longer renders a manager-owned global top bar; shell owns app-level chrome in that mode.
- Standalone and embedded manager both keep lightweight, in-viewport workflow context (active connection label, collection/root context, working status chip, and status line).
- Toolbar and onboarding connection CTAs in `collection-manager` now point users toward Account language (`Manage connections in Account` / `Manage in Account`) when embedded.
- Embedded connection launch continues to use `openManageConnections(options)` and `app:navigate` to hand off to `collection-account` as canonical.
- Manager-owned connections dialog remains available as a **compatibility fallback** only; it now presents fallback-specific labeling when reached in embedded mode.
- Manager still keeps workflow-relevant source context (active source label, connection health/readiness, publish gating, and missing connection warnings) as local workflow UI, not app-level shell chrome.

This keeps standalone manager behavior intact while reducing the impression that manager is the canonical home for full connection management.

---

## 1) Current connection/account surface area in `collection-manager`

### 1.1 Header and entry points

- Historically, `open-collections-header` provided manager-owned top chrome and connection entry points. This has been demoted from active shell rendering and replaced by manager-local browser toolbar actions.
- DOM bindings route browser-level connection events into manager handoff/fallback flows:
  - `collection-browser` event `open-manage-connections` → `openManageConnections()`
  - `collection-browser` event `add-connection` (onboarding) → `openManageConnections()`
  - `connections-list-panel` actions (`open-add-connection`, `refresh-connection`, `repair-connection`, `remove-connection`) call manager app methods directly. (`src/apps/collection-manager/src/controllers/dom-bindings.js`)

### 1.2 Dialogs and panels currently owned by manager

- `render-shell` defines a manager-local `connectionsDialog` and mounts:
  - `open-collections-connections-list`
  - `open-collections-add-connection-panel`
  (`src/apps/collection-manager/src/render/render-shell.js`)
- Manager app methods own dialog-level view orchestration and repair flows:
  - `showConnectionsListView`, `showAddConnectionView`, `openConnectionsDialog`, `openAddHostDialog`, `openCredentialRepairDialog`, `prepareSourceRepair`, `clearPendingSourceRepair`. (`src/apps/collection-manager/src/app.js`)

### 1.3 Connection UI components reused by both apps

- `connections-list-panel` renders connection cards, status pills, and per-connection actions (refresh, reconnect, credentials update, remove). (`src/apps/collection-manager/src/components/connections-list-panel.js`)
- `add-connection-panel` renders provider selection and provider configuration forms (example/local/github/s3), including repair mode and storage guidance trigger. (`src/apps/collection-manager/src/components/add-connection-panel.js`)

### 1.4 Connection runtime logic inside manager controllers

- `source-controller` owns most connection lifecycle logic:
  - provider selection/config collection and normalization
  - connect/add source
  - inspect source
  - refresh/reconnect source
  - remove source
  - source label/detail derivation
  - persisted source shaping/sanitization
  - secret persistence hooks via credential store
  (`src/apps/collection-manager/src/controllers/source-controller.js`)
- `workspace-controller` restores remembered sources and attempts auto-reconnect, also loading secure credentials during restore. (`src/apps/collection-manager/src/controllers/workspace-controller.js`)

### 1.5 Connection-related state and models in manager

- Manager state includes connection-specific fields:
  - `sources`, `selectedProviderId`, `activeSourceFilter`, `connectionsDialogView`. (`src/apps/collection-manager/src/state/initial-state.js`)
- Connection status and working-state computation are manager-local and heavily coupled to workflow UX:
  - `getSourceStatus` in `source-status.js`
  - `computeWorkingStatus` in `working-status.js`

### 1.6 Shared pieces already extracted

- Manager’s `services/credential-store.js` is already just a re-export of shared account runtime: `../../../../shared/account/credential-store.js`.
- `shared/account/*` currently provides:
  - credential storage (`credential-store.js`)
  - connection id helper (`connection-id.js`)
  - generic connection context container (`connections-context.js`)

### 1.7 Existing `collection-account` state (important migration baseline)

- `collection-account` already hosts a full in-page connections experience and reuses manager components (`connections-list-panel`, `add-connection-panel`) while duplicating substantial manager logic in its own `app.js`. (`src/apps/collection-account/src/app.js`)
- This is a key seam: there is enough parity to migrate ownership, but runtime logic is currently duplicated across manager and account.

---

## 2) Responsibility categorization (by piece)

### Should remain in `collection-manager`

- Workflow-gating logic that depends on connection state in the context of editing/publishing:
  - source-based publish eligibility, working status, and draft/publish prompts. (`state/working-status.js`)
- Active workflow source selection (`activeSourceFilter`) used for browsing/editing/publishing current collection context.
- Lightweight status display in header and browser context (e.g., selected connection label and connection health as consumed by manager UX).

### Should move to `collection-account`

- Canonical connection management UI and flows:
  - add connection
  - edit/repair credentials
  - reconnect/reselect folder
  - remove connection
  - provider-specific setup forms
- Account-facing connection list as the primary management surface.
- Future account settings UI.

### Should become shared runtime/service logic

- Connection lifecycle service currently duplicated between manager/account:
  - provider catalog model
  - provider config normalization/sanitization
  - connect/refresh/remove/inspect operations
  - source identity/dedup rules
  - persisted source shape
  - remembered-source restore + credential hydration
- Secret handling and account-scoped credential policies (already mostly shared via `shared/account/credential-store.js`).
- Connection repository/context adapter for cross-app read/write access (manager consumes; account owns management actions).

### Should become shared UI primitive

- `connections-list-panel` and `add-connection-panel` should move (or be aliased) to shared UI location because they are already reused by manager and account.
- Dialog shell wrapper around connection UI should become optional composition (manager can embed a lightweight launcher/status; account embeds full-page surface).

### Should be removed later after migration

- Manager-owned connections modal orchestration once account handoff is stable:
  - `connectionsDialog` and related open/close/view-mode methods.
- Manager-local duplicated connection management code once replaced by shared runtime adapters.
- Manager-only direct ownership of provider setup forms once account is canonical and manager only links/handoffs.

---

## 3) Target ownership model

### `collection-account` (canonical owner)

Owns:
- full connection management UX (list + create + repair + remove)
- account-facing setup/edit/remove/reconnect flows
- account settings surface

Contract:
- publishes connection state changes to shared runtime/context
- exposes stable navigation targets/entry points for other apps (including manager)

### `collection-manager` (workflow owner)

Owns:
- collection-editing workflows that depend on connection availability
- contextual connection usage (active source for publish/refresh in workflow)
- lightweight entry points/status indicators

Does not own (target):
- canonical setup/edit/remove UX
- provider credential management forms

### Shared runtime (`shared/account` + possibly new `shared/runtime/connections/*`)

Owns:
- connection service layer (connect/refresh/inspect/remove; restore remembered)
- normalized connection state model + status model
- credential store integration
- reusable helpers (identity, labels, config normalization)

---

## 4) Compatibility bridge points inside `collection-manager`

These are the safest transition seams to keep manager stable:

1. **Header action bridge**
   - current: `open-host-menu` opens manager modal
   - bridge: preserve button but route to account surface (in-shell navigation or deep-link) while fallback to manager modal during rollout.

2. **Browser add-connection bridge**
   - current: browser emits `add-connection` and manager opens connections dialog
   - bridge: switch handler to “open account connections” action; keep old behavior behind fallback flag.

3. **Repair action bridge**
   - current: list panel emits `repair-connection` and manager opens local repair flows
   - bridge: map repair events to account route with optional preselected `sourceId` + `mode` query/state.

4. **Manager assumptions of setup ownership**
   - hotspots:
     - dialog view state `connectionsDialogView`
     - pending repair state `pendingSourceRepair`
     - provider selection/config collection in manager controllers
   - bridge: keep state for compatibility short-term, but progressively replace with shared runtime actions and account-managed UX.

5. **Storage and restore coupling**
   - current manager persists/reloads remembered sources and credentials via `workspace-controller`
   - bridge: move persistence authority to shared connection repository and keep manager on read/subscribe path.

---

## 5) Recommended incremental migration phases

### Phase 0 — Baseline + guardrails (no behavior change)

- Document canonical ownership intent (this note).
- Freeze net-new connection setup UX changes in manager unless required for compatibility/bugfix.
- Add explicit TODO markers in manager connection entry handlers indicating future handoff.

### Phase 1 — Extract shared connection runtime (first code extraction)

- Create a shared connection runtime module (under `src/shared/account` or `src/shared/runtime/connections`) by lifting duplicated logic from:
  - manager `source-controller` + `workspace-controller` connection portions
  - account `app.js` connection portions
- Keep existing manager/account UI components unchanged.
- Provide an API like:
  - `connectConnection(...)`
  - `refreshConnection(...)`
  - `removeConnection(...)`
  - `inspectConnection(...)`
  - `restoreRememberedConnections(...)`

### Phase 2 — Make account canonical UI owner

- Point `collection-account` to shared runtime actions (replace duplicated local logic first).
- Ensure account writes to shared connection repository/context.
- Validate parity for add/repair/remove/reconnect for example/local/github/s3.

### Phase 3 — Adapt manager to consume shared runtime and handoff

- Replace manager connection mutation codepaths with shared runtime calls.
- Update manager header/browser “add connection” entry points to prefer account handoff.
- Keep manager modal as compatibility fallback for one phase (feature flag or runtime check).

### Phase 4 — De-scope manager-owned connection management UI

- Remove manager’s canonical connection setup/edit surfaces after parity is proven.
- Keep only:
  - lightweight status indicator
  - optional quick-action launcher to account
  - workflow-context source selector if still needed for editing/publishing.

Current incremental status:

- Header and empty-state entry points are now reduced to lightweight Account-oriented launch surfaces in embedded mode.
- Local manager dialog remains for compatibility and standalone safety, but is explicitly labeled fallback when used in embedded contexts.
- Remaining local add/repair/remove controls are retained for standalone and non-shell fallback operation.

### Phase 5 — Cleanup and deprecation removal

- Remove deprecated manager dialog/view-state code and dead handlers.
- Consolidate docs and update architecture references to account canonical ownership.

---

## 6) Major risks and coupling hotspots

1. **Logic duplication drift (manager vs account)**
   - same behaviors implemented in both apps can diverge (auth handling, error messaging, dedup rules).

2. **State ownership ambiguity**
   - manager currently acts as both workflow consumer and source-of-truth for connections in session/local storage.

3. **Credential restore edge cases across runtimes**
   - browser/capacitor/desktop behavior differs for folder handles and secure credential access.

4. **Workflow regressions in manager publish paths**
   - manager’s publish/readiness logic depends on source flags (`needsReconnect`, `needsCredentials`, capabilities) and must remain stable as ownership shifts.

5. **Storage key and persistence migration**
   - manager/account currently use different storage keys/scopes; unifying without data loss needs a compatibility migration strategy.

---

## 7) Safest next implementation step

**Next step:** extract a shared non-UI connection runtime module and switch only `collection-account` to it first.

Why this is safest:
- keeps manager behavior unchanged initially
- reduces duplication immediately
- proves shared runtime contract in the canonical owner app first
- creates a low-risk path for manager to adopt read/consume mode afterward

Suggested first extraction candidates:
- provider catalog + provider factory mapping
- source identity key and sanitized persisted-source model
- connect/refresh/remove core operations
- restore remembered-source + secure credential hydration helpers

Once account runs on shared runtime, manager can adopt the same runtime API behind existing handlers with minimal UI churn.

---

## 8) Phase 1 follow-up (implemented 2026-03-27)

Completed in this step:

- Added `src/shared/account/connections-runtime.js` as a shared non-UI connection runtime/service layer.
  - Centralizes provider factories/catalog construction.
  - Centralizes connection config sanitization and source label/detail derivation.
  - Provides runtime actions for account flows: connect, refresh, remove, persist, restore remembered sources.
- Updated `collection-account` to use the shared runtime as the canonical logic basis for connection lifecycle actions.
- Updated `collection-manager` to consume shared runtime primitives (provider catalog/factory creation and shared config/label helpers) while preserving manager UI behavior and manager-specific workflow state ownership.

Still temporarily manager-owned:

- Manager dialog orchestration (`connectionsDialogView`, pending repair dialog flow state).
- Manager publish/readiness workflow coupling (`working-status`, source collections/assets merge behavior, publish guards).
- Manager-specific remembered-source auto-reconnect policy and workspace-selection restore behavior.

Next clean handoff step:

- Move manager `connectCurrentProvider` / `refreshSource` mutation internals behind the shared runtime action contract (retain existing manager handlers as delegates), then convert manager UI entry points to account-first navigation with manager dialog fallback.

---

## 9) Phase 2 incremental compatibility step (implemented 2026-03-27)

Completed in this step:

- Refactored manager mutation internals to delegate to shared runtime action methods:
  - `connectCurrentProvider` now delegates connect/add mutation behavior through `connectionsRuntime.connectSource(...)`.
  - `refreshSource` now delegates reconnect/repair mutation behavior through `connectionsRuntime.refreshSource(...)`.
  - `removeSource` now delegates removal/credential cleanup through `connectionsRuntime.removeSource(...)`.
- Aligned manager persistence/restore coupling one step further with shared runtime:
  - manager `saveSourcesToStorage` now uses `connectionsRuntime.persistSources(...)` for local remembered-source persistence.
  - manager restore flow now uses `connectionsRuntime.restoreRememberedSources()` as the local-storage baseline when OPFS-backed state is not present, while preserving manager-specific restore policy and post-processing.
- Added a low-risk manager handoff seam:
  - new `openManageConnections(options)` bridge in manager app supports future account-first navigation via optional `onManageConnections` delegate, with manager dialog fallback preserved.
  - header and browser “add connection” entry points now route through this seam.
- Extended shared runtime action responses with optional compatibility payload (`loadedAssets`, `providerResult`) so manager can preserve current asset/collection merge behavior while consuming shared mutation actions.

Still temporarily manager-owned:

- Manager connections dialog and repair view orchestration (`connectionsDialogView`, pending repair state and add-panel flow).
- Manager workflow-coupled source/asset/collection merge behavior and publish/readiness orchestration.
- Manager-specific remembered-source auto-reconnect policy and runtime-specific local-folder restore handling.

Remaining before canonical account handoff / manager UI removal:

- Route manager `openManageConnections` to account navigation by default (keeping modal fallback behind a compatibility gate).
- Migrate remaining manager-owned restore/reconnect edge handling into shared runtime adapters where safe.
- De-scope manager-owned connection setup dialogs once account-first entry parity and workflow safety are validated.

---

## 10) Phase 3 account-first handoff default (implemented 2026-03-27)

Completed in this step:

- `collection-manager` now treats account handoff as the default `openManageConnections(options)` behavior in shell/embedded-friendly runtime detection (`data-oc-app-mode="embedded"`, `data-shell-embed`, or `data-workbench-embed`).
- Manager now emits a cancelable `app:navigate` request with a lightweight handoff payload:
  - `sourceAppId: "collection-manager"`
  - `targetAppId: "collection-account"`
  - `targetSection: "connections"`
  - passthrough metadata (`intent`, `source`, optional `sourceId`, optional `mode`)
- `app-shell` now handles this navigation request by switching to the Account section and acknowledging handling via `preventDefault()`.
- `collection-manager` keeps compatibility fallback behavior intact:
  1. prefer embedded handoff first
  2. then optional `onManageConnections` delegate (if present)
  3. finally fallback to manager-owned local connections dialog

Fallback conditions (still supported):

- standalone manager runtime (no shell/embed markers)
- embedded runtime where no host/shell listener handles `app:navigate`
- explicit compatibility delegate path via `onManageConnections`

Still temporarily manager-owned after this step:

- local connections dialog, list/add/repair orchestration, and pending-repair view state
- manager-side connection repair and mutation affordances used when fallback is active

Next cleanup step after this migration:

- remove manager’s canonical connection management dialog entry surfaces after one stabilization pass confirms shell/account handoff coverage, while retaining only lightweight status/quick-launch affordances into Account.
