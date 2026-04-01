# Connection startup + ownership migration plan

Date: 2026-04-01  
Status: Proposed incremental migration  
Scope: `app-shell`, `collection-account`, `collection-manager`, new `collection-connector`, shared connection runtime

## Goal

Separate connection management from account management without destabilizing current workflows:

- `collection-manager` remains focused on collections/items/media workflow.
- `collection-account` becomes account/profile/preferences only.
- new `collection-connector` becomes canonical connection-management UI.
- shell gains a first-class `Connect` nav item.
- shared startup runtime owns bootstrap of built-in/default connections.

## A) Recommended target ownership model

### 1) Built-in Example/default source definition

**Owner: shared startup runtime in `src/shared/account` (or `src/shared/runtime/connections`).**

- Canonical default source metadata/config should live in one shared module.
- Existing `built-in-example-source.js` stays the canonical source definition seam and should be consumed by shell startup bootstrap + connector runtime actions.
- Apps (`manager`, `account`, `connector`) should not redefine built-in defaults locally.

### 2) Startup bootstrap

**Owner: shell-triggered shared runtime bootstrap.**

- Shell (`app-shell`) should trigger startup once per shell session (embedded app host boundary).
- Shared runtime performs idempotent bootstrap:
  - ensure built-in Example source exists (or is revalidated),
  - restore remembered connections,
  - publish initial connection state into shared context/store.
- `manager` and `account` consume resulting state; no app-specific startup bootstrap logic.

### 3) Connection management UI

**Owner: new `collection-connector` app.**

- Connector app is canonical UI for add/repair/remove/reconnect/enable/disable connection flows.
- Existing connection panels/components currently reused in account/manager should be hosted by connector app and progressively moved to shared UI primitives/panels if reused across apps.
- `collection-manager` may keep lightweight status and quick launch into connector, but not canonical setup forms.

### 4) Account/profile UI

**Owner: `collection-account`.**

- Account app should focus on profile, preferences, workspace/account settings.
- Connection CRUD and setup UX should move out of account into connector.
- Account can display read-only connection summary links if needed, but management actions route to connector.

### 5) Shared connection state contract

**Owner: shared runtime + shared context.**

- `manager`, `account`, and `connector` all read/write through one runtime/context contract.
- Prevents parallel startup logic and avoids duplicate provider config rules.

## B) Migration phases (minimal-risk order)

### Phase 0 — Decision + contract freeze (no behavior change)

- Approve ownership split and target app map.
- Define shell section key/appId contract for new connector section (`connect` -> `collection-connector`).
- Define runtime bootstrap contract (idempotent `ensureStartupConnections()` style API).

### Phase 1 — Shared startup bootstrap extraction (small runtime-only step)

- Add shared startup bootstrap module near existing shared account runtime.
- Keep existing behavior by calling same underlying connection runtime utilities.
- Do not move UI yet.

### Phase 2 — Shell wiring for `Connect` section (safe surface change)

- Add `Connect` nav item and section adapter in shell.
- Mount temporary connector placeholder component or view with no destructive actions.
- Keep account + manager connection entry points functional during overlap.

### Phase 3 — Introduce `collection-connector` MVP (reuse existing panels)

- Create connector app root and route connection management UI there.
- Reuse current list/add/repair panels to avoid risky UI rewrite.
- Route shell navigation + handoff events (`app:navigate`) to connector as canonical target.

### Phase 4 — Move connection management out of account

- Remove connection setup CRUD panels from account page composition.
- Replace with account-focused settings and optional link/summary to connector.

### Phase 5 — Reduce manager fallback ownership

- Keep manager workflow-only connection consumption and status.
- Remove manager-owned canonical connection dialogs/forms once connector parity is stable.
- Retain compatibility fallback briefly behind guard if needed, then delete.

## C) Smallest safe first implementation step

**First concrete step: add a shared startup bootstrap module that centralizes built-in Example + remembered connection initialization, but does not change UI ownership yet.**

Why this is smallest + safest:

- no broad UI changes,
- shell/account/manager behavior can remain functionally identical,
- immediately establishes single startup authority,
- creates the seam connector app will later rely on.

Suggested first API shape:

- `createConnectionsStartupRuntime({ connectionsRuntime, context, builtInSourceHelpers, storage })`
- `ensureBootstrapped()` (idempotent)
- `getStartupSnapshot()`

Initial call site:

- shell startup path (`open-app-shell` mount lifecycle) triggers `ensureBootstrapped()` once.

## D) What should move vs not move yet

### Move from `collection-account` to `collection-connector` (target)

- connection list and per-connection actions,
- add connection/setup flows,
- credential repair/reconnect/remove flows,
- provider-specific connection forms.

### Do NOT move yet (to keep risk low)

- manager workflow-coupled publish/readiness logic,
- manager source selection behavior used during edit/publish,
- account profile/preferences settings,
- provider implementation internals,
- present app surfaces (explicitly out of scope).

## E) Shell/nav changes required for `Connect`

1. Add a new section key in shell header model:
   - `connect` with label `Connect` and appropriate icon.
2. Add shell section adapter entry:
   - `connect` -> appId `collection-connector`, tag `open-collections-connector`.
3. Add mount target generation automatically via adapter key list (already key-driven).
4. Extend shell navigate event handling:
   - accept `targetAppId: "collection-connector"` and set active section to `connect`.
5. During transition, optionally map legacy connection-target navigation (`collection-account` + `targetSection: "connections"`) to `connect`.

## F) Files likely involved in upcoming implementation

### Shared startup runtime + canonical built-in config

- `src/shared/account/built-in-example-source.js` (canonical built-in Example/default definition).
- `src/shared/account/connections-runtime.js` (current shared connection runtime primitives).
- **new** `src/shared/account/connections-startup-runtime.js` (startup bootstrap authority, idempotent init).
- `src/shared/account/index.js` (export wiring).

### Shell/nav wiring for connector app

- `src/apps/app-shell/src/components/shell-header.js` (new `Connect` nav item).
- `src/apps/app-shell/src/components/section-adapters.js` (new `connect` adapter to connector app).
- `src/apps/app-shell/src/index.js` (import connector app entry; navigate mapping to connect section).
- optionally `src/apps/app-shell/src/components/shell-view.js` if placeholder content is needed during incremental rollout.

### New connector app integration

- **new app root** `src/apps/collection-connector/` (`index.html`, `src/index.js`, `src/main.js`, `package.json`, UI components).
- connector should compose existing connection panels first, then progressively extract shared primitives where justified.

### Account and manager trim (later phases)

- `src/apps/collection-account/src/app.js` + account components that currently host connection management.
- manager connection handoff seams in `src/apps/collection-manager/src/app.js` and related UI entry handlers.

## Implementation guardrails

- Keep migration incremental and reversible by phase.
- Preserve current working flows while introducing shared startup authority first.
- Avoid touching `collection-presenter` during this migration.
- Prefer moving ownership via adapters and handoff seams before deleting fallback logic.
