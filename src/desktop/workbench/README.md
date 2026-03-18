# Open Collections Workbench (Tauri)

This is a lightweight shared desktop shell that hosts both existing Web Component apps:

- `src/apps/manager`
- `src/apps/browser`

## Run in desktop mode

```bash
cd src/desktop/workbench
pnpm install
pnpm tauri:dev
```

The Tauri window opens Manager by default. Use the shell bar to switch between Manager and Browser.
The shell is full-window and embeds the selected app directly (no launcher screen).

## Windows release artifacts

```bash
cd src/desktop/workbench
pnpm tauri:build
```

Build output is written under `src/desktop/workbench/src-tauri/target/release/bundle/`.

Recommended distribution artifacts:

- `nsis/Open Collections Workbench_0.1.0_x64-setup.exe` (primary installer for preview users)
- `msi/Open Collections Workbench_0.1.0_x64_en-US.msi` (alternative enterprise-friendly installer)

The raw binary `target/release/open-collections-workbench.exe` is mainly a direct run/debug artifact, not the preferred install package.

## Architecture notes

- The desktop shell UI lives in `src/desktop/workbench`.
- The native bridge lives in `src/desktop/workbench/src-tauri`.
- Shared file/folder/storage APIs live in `src/shared/platform`.
- Manager and Browser remain browser-first Web Component apps.

## Platform layer

`src/shared/platform` exports a small API:

- `getPlatformType()`
- `openTextFile()`
- `openJsonFile()`
- `saveTextFile()`
- `saveJsonFile()`
- `openDirectory()`
- `readTextFile()`
- `writeTextFile()`
- `rememberWorkspaceState()`
- `loadWorkspaceState()`

Browser builds use browser APIs; desktop builds route these calls through Tauri commands.
