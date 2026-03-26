# Open Collections Workbench (Capacitor)

This is the mobile host shell for the existing browser-first Open Collections apps.

## What this shell does

- Reuses the same shell behavior as desktop (`src/desktop/workbench/src/main.js`).
- Stages the existing `src/apps`, `src/shared`, and package code into `dist/`.
- Lets Capacitor host that staged frontend in Android/iOS WebViews.

## Typical commands

```bash
pnpm mobile:dev
pnpm mobile:sync
pnpm mobile:open:android
pnpm mobile:open:ios
```

If native projects have not been created yet, run:

```bash
pnpm --filter @open-collections/workbench-mobile cap:add:android
pnpm --filter @open-collections/workbench-mobile cap:add:ios
```
