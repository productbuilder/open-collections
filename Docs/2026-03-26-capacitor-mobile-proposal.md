# Open Collections Mobile Implementation Notes
Date: 2026-03-26

This file records the implemented mobile state (not a forward plan).

## Current state

- Mobile shell package: `src/mobile/workbench`
- Native host: Capacitor (Android/iOS)
- Current in-shell app target: `src/apps/collection-browser`
- Platform adapter: `src/shared/platform/capacitor-platform.js`
- Runtime selection: `src/shared/platform/index.js`

## Workflow

From repository root:

```bash
pnpm mobile:dev
pnpm mobile:sync
pnpm mobile:open:android
pnpm mobile:open:ios
```

## Known limits

- Manager is not mounted as a first-class mobile shell route yet.
- Directory-handle workflows are unsupported on Capacitor.
- Drag/drop remains desktop-only.

For ongoing canonical docs, see:

- `README.md`
- `src/mobile/workbench/README.md`
