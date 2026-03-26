# Open Collections Mobile Proposal (Capacitor)
Date: 2026-03-26
Author: ChatGPT
Audience: Codex / engineering implementation

## Goal
Create Android and iOS apps for Open Collections using Capacitor as the native shell while reusing the existing browser-first Web Component apps, similar to the current Tauri desktop approach.

## Why this fits the current repo
The repository is already organized around shared web apps and a native shell for desktop:

- The repo root README describes a monorepo with browser apps in `src/apps/`, shared runtime in `src/shared/`, and the desktop/Tauri workbench in `src/desktop/workbench`. îˆ€fileciteîˆ‚turn3file1îˆ
- The desktop workbench README states that the Tauri shell hosts the existing Web Component apps `src/apps/collection-manager` and `src/apps/collection-browser`, while those apps remain browser-first. It also notes that shared platform APIs live in `src/shared/platform`. îˆ€fileciteîˆ‚turn3file0îˆ

This means the repo already has the right separation of concerns for a second native shell:

- Shared app UI: `src/apps/*`
- Shared platform abstraction: `src/shared/platform`
- Desktop native host: `src/desktop/workbench`
- Proposed mobile native host: `src/mobile/workbench`

## Recommendation
Use **Capacitor** to create a mobile shell that loads the same web apps and routes native-only actions through a new mobile platform adapter.

### Recommended first target
Start with **Collection Browser** first, then move to **Collection Manager**.

Reasoning:
- Browser-style/read-only flows are lower risk for a first mobile shell.
- Manager workflows often depend more heavily on desktop-style file, directory, import/export, and workspace state behaviors.

## Proposed architecture

### 1. Add a mobile host app
Create a new package:

`src/mobile/workbench/`

This should play the same role for mobile that `src/desktop/workbench/` plays for desktop.

Suggested responsibilities:
- App bootstrap for Capacitor
- Native platform registration and plugin wiring
- App routing / shell navigation between Manager and Browser
- Asset build target for Android and iOS

Suggested structure:

```text
src/mobile/workbench/
  package.json
  capacitor.config.ts
  index.html
  src/
    main.js
    shell/
      mobile-shell.js
      routes.js
    platform/
      capacitor-bridge.js
  android/
  ios/
```

### 2. Keep the app UIs shared
Continue to treat these as browser-first apps:

- `src/apps/collection-browser`
- `src/apps/collection-manager`

Do not fork the UI unless mobile ergonomics force it.
Instead:
- keep view components shared
- add mobile-specific CSS/layout handling where needed
- move platform differences behind the shared platform API

### 3. Extend the shared platform abstraction
The desktop README documents the current shared platform contract as:

- `getPlatformType()`
- `openTextFile()`
- `openJsonFile()`
- `saveTextFile()`
- `saveJsonFile()`
- `openDirectory()`
- `readTextFile()`
- `writeTextFile()`
- `rememberWorkspaceState()`
- `loadWorkspaceState()` îˆ€fileciteîˆ‚turn3file0îˆ

That is a strong starting point, but some of these APIs are desktop-shaped. For mobile, the platform layer should evolve from **file-system primitive APIs** toward **capability/task APIs**.

### Proposed next-generation platform API
Keep compatibility where practical, but add or migrate toward:

```ts
getPlatformType(): 'browser' | 'tauri' | 'capacitor'

pickTextFile(): Promise<{ name, text } | null>
pickJsonFile(): Promise<{ name, json } | null>
pickImages(): Promise<Array<{ name, mimeType, blob }>>
pickDocument(): Promise<{ name, mimeType, blob } | null>
saveTextDocument(name: string, content: string): Promise<void>
saveJsonDocument(name: string, data: unknown): Promise<void>
shareFile(input): Promise<void>
openExternalUrl(url: string): Promise<void>

loadWorkspaceState(): Promise<WorkspaceState | null>
saveWorkspaceState(state: WorkspaceState): Promise<void>

loadDraft(key: string): Promise<unknown | null>
saveDraft(key: string, value: unknown): Promise<void>
removeDraft(key: string): Promise<void>
```

### Proposed implementation files
In `src/shared/platform/`:

```text
src/shared/platform/
  index.js
  browser-platform.js
  tauri-platform.js
  capacitor-platform.js
  capabilities.js
```

Notes:
- `browser-platform.js` remains the fallback web implementation.
- `tauri-platform.js` keeps desktop-native behavior.
- `capacitor-platform.js` maps the same app contract to Capacitor plugins.
- `capabilities.js` can expose feature flags like `supportsDirectorySelection`, `supportsCameraImport`, `supportsNativeShare`, etc.

## Platform-specific design guidance

### Android/iOS realities
Capacitor is a good fit for reusing Web Components, but mobile should not be treated as â€œdesktop in a smaller window.â€

Key rule:
- Do not try to preserve directory-centric desktop workflows one-for-one on mobile.

Instead convert desktop-oriented actions into mobile tasks such as:
- import a file
- import photos
- open a saved draft
- share/export a collection file
- resume last session

### File and storage model
The current platform surface includes `openDirectory()` and low-level text file reads/writes. îˆ€fileciteîˆ‚turn3file0îˆ
That works for Tauri and browser contexts with file APIs, but mobile should prefer:

- document picker instead of directory picker
- photo library / camera picker for media ingestion
- app sandbox persistence for drafts and session state
- share sheet / export flows for outgoing files

Recommended mapping:

- Workspace/session state -> Capacitor Preferences or local storage abstraction
- Small JSON drafts/settings -> Preferences or app-private file storage
- Larger working sets / cache -> Capacitor Filesystem or SQLite-backed persistence
- Image import -> Camera / file picker plugins
- Export/share -> Share plugin and Filesystem

## Proposed delivery phases

### Phase 1: Mobile shell for Collection Browser
Target: prove the shell architecture with minimal platform risk.

Scope:
- Add `src/mobile/workbench`
- Render `collection-browser` in Capacitor shell
- Add mobile shell navigation
- Confirm routing, assets, deep links, and responsive layout
- Add simple persisted app/session state

Definition of done:
- Android and iOS apps launch successfully
- Browser app is usable in WebView
- Last-opened screen/view can be restored
- External links and basic sharing work

### Phase 2: Shared platform evolution
Target: make platform APIs mobile-safe.

Scope:
- Audit current `src/shared/platform` usages
- Identify desktop-only APIs and replace call sites with capability/task APIs
- Add `capacitor-platform.js`
- Add capability detection

Definition of done:
- Shared apps can branch on features, not OS assumptions
- Browser/Tauri/Capacitor all compile against the same shared interface

### Phase 3: Manager mobile MVP
Target: bring Collection Manager to mobile with constrained workflows.

Scope:
- File import via picker
- Photo import via camera/library
- Draft persistence
- Export/share flows
- Reduced mobile layout for core workflows only

Definition of done:
- A user can create/edit a collection on mobile
- A user can import required assets without desktop drag-and-drop
- A user can save/resume/export their work

### Phase 4: Mobile-specific UX polish
Scope:
- Touch-friendly density and controls
- Keyboard-safe forms
- Offline/retry behavior
- Upload/progress states
- Native affordances and icon/splash polish

## Codex implementation proposal

### Proposed new package files

```text
src/mobile/workbench/package.json
src/mobile/workbench/capacitor.config.ts
src/mobile/workbench/index.html
src/mobile/workbench/src/main.js
src/mobile/workbench/src/shell/mobile-shell.js
src/mobile/workbench/src/shell/routes.js
src/mobile/workbench/src/platform/capacitor-bridge.js
```

### Proposed package scripts
At repo root, add scripts analogous to the existing desktop commands documented in the root README (`pnpm desktop:dev`, `pnpm desktop:build`). îˆ€fileciteîˆ‚turn3file1îˆ

Suggested additions:

```json
{
  "scripts": {
    "mobile:dev": "pnpm --dir src/mobile/workbench dev",
    "mobile:build": "pnpm --dir src/mobile/workbench build",
    "mobile:android": "pnpm --dir src/mobile/workbench cap run android",
    "mobile:ios": "pnpm --dir src/mobile/workbench cap run ios",
    "mobile:sync": "pnpm --dir src/mobile/workbench cap sync"
  }
}
```

### Proposed dependencies for mobile package
Likely starting point:

```json
{
  "dependencies": {
    "@capacitor/core": "latest",
    "@capacitor/app": "latest",
    "@capacitor/preferences": "latest",
    "@capacitor/filesystem": "latest",
    "@capacitor/share": "latest",
    "@capacitor/browser": "latest"
  },
  "devDependencies": {
    "@capacitor/cli": "latest",
    "@capacitor/android": "latest",
    "@capacitor/ios": "latest"
  }
}
```

Potential later additions depending on flows:
- Camera plugin
- File picker plugin
- Keyboard plugin
- Splash screen/status bar plugins

## Concrete refactor targets for Codex

### A. Audit `src/shared/platform`
Codex should:
1. Inventory every exported API in `src/shared/platform`
2. Find all call sites across `src/apps/*`, `src/shared/*`, and `src/desktop/workbench`
3. Classify each API as:
   - cross-platform as-is
   - needs capability guard
   - desktop-only and should be replaced

Expected result:
A migration table like:

| Current API | Keep | Replace with | Notes |
|---|---|---|---|
| `openJsonFile()` | maybe | `pickJsonFile()` | naming should reflect picker-based UX |
| `openDirectory()` | no for mobile | remove or gate | not a reliable mobile abstraction |
| `rememberWorkspaceState()` | yes | maybe alias to `saveWorkspaceState()` | good cross-platform concept |
| `writeTextFile()` | maybe | `saveTextDocument()` | mobile needs mediated export path |

### B. Create a `capacitor-platform.js`
Codex should implement a first-pass adapter that supports:
- platform type detection
- workspace/session persistence
- opening external links
- exporting/sharing text or JSON
- safe no-op or explicit unsupported responses for directory-based APIs

### C. Add feature detection
Codex should expose a capabilities object, for example:

```ts
{
  supportsDirectorySelection: false,
  supportsCameraImport: true,
  supportsNativeShare: true,
  supportsDragAndDrop: false,
  supportsLocalDraftPersistence: true
}
```

App code should branch on capabilities instead of testing for specific platforms whenever possible.

### D. Build Browser first
Codex should wire the mobile shell to `collection-browser` before attempting Manager.

Success criteria:
- Browser app renders inside Capacitor shell
- Navigation works
- Shared runtime imports resolve cleanly
- No Tauri-only code leaks into the mobile build

### E. Then add Manager with scoped workflows
Codex should not attempt full parity immediately.
Initial mobile Manager scope should exclude or guard:
- directory selection flows
- drag-and-drop-only flows
- desktop-only workspace assumptions

## UX recommendations for mobile

### Browser
- Keep this as the first-class mobile experience.
- Prefer bottom navigation or a compact top bar.
- Make cards, list rows, and preview surfaces touch-safe.

### Manager
- Treat mobile as a focused editor, not the full desktop workbench.
- Collapse multi-panel layouts into step-based or stacked flows.
- Replace drag-and-drop with explicit import buttons.
- Ensure camera/photo library is first-class if images are part of the workflow.

## Risks and mitigations

### Risk 1: Desktop APIs leak into mobile code
Mitigation:
- centralize all platform behavior in `src/shared/platform`
- forbid direct Tauri imports from shared app code

### Risk 2: File workflows are too desktop-specific
Mitigation:
- redesign around picker/import/export/share tasks
- ship Browser first and Manager second

### Risk 3: Responsive layout is insufficient for real phone usage
Mitigation:
- test on phone-sized viewports early
- add mobile-specific layout states instead of forcing desktop panels to shrink

### Risk 4: Persistence strategy diverges unpredictably
Mitigation:
- define one storage contract in shared platform
- let each host implement it natively

## Suggested acceptance criteria

### Milestone 1
- New `src/mobile/workbench` package exists
- Capacitor Android/iOS projects are generated
- Collection Browser launches inside the mobile shell
- Shared code compiles without Tauri dependencies in mobile bundle

### Milestone 2
- `src/shared/platform` supports browser, tauri, and capacitor targets
- Capability flags exist and are consumed in app code
- Session persistence works on mobile

### Milestone 3
- Manager mobile MVP supports import, edit, save draft, and export/share
- Unsupported desktop-only actions are hidden or replaced on mobile

## Recommended Codex prompt
Use this as the implementation brief for Codex:

```md
Implement a new mobile shell for Open Collections using Capacitor, modeled after the existing Tauri workbench but reusing the current browser-first Web Component apps.

Constraints:
- Preserve `src/apps/collection-browser` and `src/apps/collection-manager` as shared web apps.
- Add a new package at `src/mobile/workbench`.
- Extend `src/shared/platform` with a Capacitor-backed implementation.
- Do not import Tauri APIs from shared app code.
- Prioritize Collection Browser first, then Collection Manager.
- Replace desktop-centric assumptions (especially directory selection and drag/drop) with capability-based mobile-safe APIs.

Tasks:
1. Audit `src/shared/platform` exports and call sites.
2. Create `capacitor-platform.js` and capability flags.
3. Scaffold `src/mobile/workbench` with Capacitor config and build scripts.
4. Render Collection Browser in the mobile shell.
5. Add persistence for session/workspace state.
6. Prepare Manager for mobile by gating or refactoring desktop-only flows.
7. Document any unsupported flows and TODOs inline.
```
