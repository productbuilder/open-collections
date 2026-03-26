# Open Collections Workbench (Capacitor)

Capacitor is the mobile shell for Open Collections. It hosts the same browser-first app code in native Android/iOS WebViews.

## What the mobile shell is

- Package: `src/mobile/workbench`
- Host type: native shell (Capacitor)
- Current app target: `src/apps/collection-browser`
- Entry point: `src/mobile/workbench/src/main.js`

The shell stages source into `src/mobile/workbench/dist`, then Capacitor loads that staged frontend in platform projects under `android/` and `ios/`.

## Relationship to browser-first apps and the desktop shell

Open Collections keeps app UI/browser logic in `src/apps/*`. Native shells embed those apps and provide platform-specific adapters:

- Browser runtime: uses `src/shared/platform/browser-platform.js`
- Desktop runtime (Tauri): uses `src/shared/platform/tauri-platform.js`
- Mobile runtime (Capacitor): uses `src/shared/platform/capacitor-platform.js`

Runtime detection and adapter selection are centralized in `src/shared/platform/index.js`.

## Prerequisites

- Run `pnpm install` from repository root.
- Install Android Studio for Android builds.
- Install Xcode for iOS builds (macOS only).
- Ensure native toolchains required by Capacitor are installed.

## Build, sync, and run workflow

From repo root:

```bash
pnpm mobile:dev
```

- Stages frontend files into `src/mobile/workbench/dist`
- Starts the local static server used for shell debugging

Before opening native IDE projects:

```bash
pnpm mobile:sync
```

- Re-stages frontend
- Copies web assets and Capacitor config into `android/` and `ios/`

## Run Android

One-time project creation (if `android/` does not exist yet):

```bash
pnpm --filter @open-collections/workbench-mobile cap:add:android
```

Open the Android project in Android Studio:

```bash
pnpm mobile:open:android
```

Then run from Android Studio (emulator or device).

## Run iOS

One-time project creation (if `ios/` does not exist yet):

```bash
pnpm --filter @open-collections/workbench-mobile cap:add:ios
```

Open the iOS project in Xcode:

```bash
pnpm mobile:open:ios
```

Then run from Xcode (simulator or device).

## Platform adapter organization

Relevant adapter and persistence files:

- `src/shared/platform/index.js` - runtime detection and adapter selection
- `src/shared/platform/browser-platform.js` - default web implementation
- `src/shared/platform/tauri-platform.js` - desktop native bridge
- `src/shared/platform/capacitor-platform.js` - mobile bridge (file pickers, export/save fallback, limited native integrations)
- `src/shared/platform/mobile-persistence.js` - native preferences/local-storage mirroring for mobile-safe state persistence

## Current limitations and deferred features

Current implementation limits:

- Mobile shell currently mounts **Collection Browser** only, not Manager shell routing.
- `openDirectory()` is intentionally unsupported on Capacitor.
- Desktop drag/drop semantics are unavailable in mobile WebViews.
- `writeTextFile()` in-place writes are unsupported on Capacitor; export/save flow is used instead.
- Native file-picker plugin usage is optional/fallback-based; HTML file input fallback is used when plugin support is unavailable.

Deferred work (not implemented yet):

- Manager-first mobile workflows as a default shell target
- Directory-equivalent local workspace flows for mobile
- Full parity with desktop-native file system operations
- Additional mobile-specific UX and feature-polish tasks beyond current adapter boundaries
