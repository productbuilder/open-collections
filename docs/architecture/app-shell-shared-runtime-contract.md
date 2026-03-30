# App shell shared runtime contract (incremental v1)

## Why this exists

Open Collections now has four main apps (`collection-browser`, `collection-manager`, `collection-presenter`, `collection-account`) that need to run in two ways:

1. standalone (direct app URL)
2. embedded (mounted inside `app-shell`)

This document defines the lightweight shared runtime contract introduced in this change set.

---

## 1) App mount contract (`src/shared/runtime/app-mount-contract.js`)

### Runtime modes

- `standalone`
- `embedded`

### Context shape

`createAppRuntimeContext({...})` creates a common mount context with:

- `appId` – stable identifier (`collection-manager`, `collection-browser`, etc.)
- `mode` – `standalone` or `embedded`
- `target` – mount target element
- `config` – app-specific mount options
- `hostCapabilities` – optional host capability bridge
- `emit(type, detail)` – lifecycle/event callback channel

### Lifecycle + event flow

Lifecycle/event names are shared as constants:

- `app:mounted`
- `app:updated`
- `app:unmounted`
- `app:navigate`
- `app:status`
- `app:request-notification`

Current shell handling:

- `app:request-notification` → host toast presentation
- `app:navigate` (when `targetAppId` is `collection-account`) → shell section switch to Account

### Adapter seam

`createWebComponentAppAdapter({...})` provides an incremental adapter for existing web-component apps. It standardizes:

- `mount(context)`
- `update(nextConfig)`
- `unmount()`

No app business logic is moved into the contract.

---

## 2) Host capability model (`src/shared/runtime/host-capabilities.js`)

`createHostCapabilities({...})` defines a host-agnostic surface for cross-host app embedding.

### Included capabilities (v1)

- `notify(message, options)`
- `openExternalLink(url)`
- `writeClipboardText(text)`
- `share(data)`
- `getPersistedState(key)` / `setPersistedState(key, value)` / `clearPersistedState(key)`
- `getLayoutHints()` (safe-area data)
- `showDialog(...)` / `closeDialog(...)` (optional host-owned dialog bridge)

### Host portability

- Browser: uses browser APIs and events
- Desktop/Tauri: can delegate external-link behavior through platform API
- Mobile/Capacitor: same shape, different host wiring

This keeps app code host-agnostic while preserving incremental platform adapters in `src/shared/platform`.

---

## 3) Shared runtime UI primitives (`src/shared/ui/app-runtime/*`)

Added shared primitives for cross-app consistency in standalone and embedded contexts:

- `renderLoaderState`
- `renderEmptyState`
- `renderErrorState`
- `renderSuccessState`
- `createToastLayer`

The first shell integration uses toast primitives as host-level notifications.

---

## 4) Account/connection shared basis (`src/shared/account/*`)

To reduce manager-ownership of account/connection foundations:

- `src/shared/account/credential-store.js` now hosts credential storage logic used by account and manager.
- `src/shared/account/connection-id.js` provides shared connection id generation.
- `src/shared/account/connections-context.js` defines a minimal reusable connection context store.

`collection-manager` keeps compatibility through a re-export at
`src/apps/collection-manager/src/services/credential-store.js`.

### Connection terminology boundary

Within runtime contracts/docs:

- **Connection** means the saved runtime/app link to a host/source (id, config, credential relationship, status).
- **Source** means the app-consumable entry point resolved from that link (`collections.json` or `collection.json`).
- **Host** means the underlying storage location/provider root.
- **Collection** means content data described by protocol manifests.

Connection runtime/state is not itself a protocol manifest file. Protocol filenames remain `collections.json` (multi-collection index) and `collection.json` (single collection manifest); `connection.json` is not introduced in this contract phase.

---

## 5) Shell vs shared runtime vs app-specific boundaries

### Shell-owned

- global app navigation and section switching
- embedded mount orchestration
- host-level toast behavior

### Shared runtime-owned

- mount contract and lifecycle/event constants
- host capability abstraction
- cross-app runtime UI primitives
- account/connection shared contracts and helpers

### App-owned

- domain logic (browse, collect, account workflows, presenter workflows)
- provider-specific integration behavior
- app-local rendering details and workflow state

### Shell/session lifecycle rule (embedded mode)

During normal section switching inside `app-shell`, treat mounted apps as one continuous shell session:

- Keep section app instances mounted by default and switch visibility/presentation per active section.
- Do not unmount/remount apps for routine intra-session navigation.
- Preserve in-memory workflow/live session state across section switches.
- Reserve unmount/remount for explicit session-boundary events (shell teardown, hard reload, explicit reset).

This rule is about host lifecycle orchestration only; app-specific business logic ownership remains with each embedded app.

### Desktop work-surface scroll guidance

For desktop embedded app/work surfaces that behave like multi-panel workspaces, prefer panel-local or app-local scroll regions over whole-document scrolling when that improves interaction stability.

- Keep shell/header/nav presentation stable while users work inside app surfaces.
- Avoid page-level scrollbar changes that can produce header/nav jump.
- Preserve independent panel usability where parallel workflows are expected.

This is guidance for workspace-like surfaces, not a blanket requirement for every embedded screen.

### Performance + lazy-loading rule

Shared runtime integrations should assume high-volume datasets and async hydration paths.

- Prefer incremental hydration/loading paths over loading full collection/source state up front.
- Wire host/app seams so screens can render partial data early and continue filling asynchronously.
- Keep async loading feedback local to the surface being hydrated (panel/view), using loading UI primitives where appropriate.
- Avoid host/runtime patterns that force rendering or retaining data that is outside the current user view.
- Use virtualization/windowing where justified by observed volume/cost, without mandating heavyweight abstractions for all views.

### Browser vs manager surface intent

`collection-manager` and `collection-browser` intentionally optimize for different primary tasks.

- Manager is management/workflow-first, so persistent detail/metadata/editor panels are valid when they actively support editing, assignment, and settings tasks.
- Browser is viewing/discovery-first, so metadata/details should generally remain available but secondary, revealed via explicit action unless a browser use case clearly requires persistent visibility.

---

## 6) Standardized layout/tokens updates

`src/shared/ui/app-foundation` now includes:

- safe-area tokens
- mobile nav-height token
- app frame safe-area padding baseline

This improves consistency for:

- shell-embedded apps
- standalone apps on mobile
- host shells with bottom navigation

---

## 7) Incremental integration status

`app-shell` now mounts real sub-app web components through section adapters in:

- `src/apps/app-shell/src/components/section-adapters.js`

Current mapping:

- Browse → `timemap-browser`
- Collect → `open-collections-manager`
- Present → `open-collections-presenter`
- Account → `open-collections-account`

This is intentionally conservative: existing app internals are preserved.
