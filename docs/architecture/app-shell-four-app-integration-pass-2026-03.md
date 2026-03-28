# App-shell four-app integration pass (2026-03)

## Current integration state before this pass

The shell already mounted the four primary apps through explicit section adapters:

- Browse → `collection-browser` (`timemap-browser`)
- Collect → `collection-manager` (`open-collections-manager`)
- Present → `collection-presenter` (`open-collections-presenter`)
- Account → `collection-account` (`open-collections-account`)

Key seam observations before this pass:

- `collection-browser` and `collection-manager` already had explicit embedded styling paths, but primarily keyed to legacy `data-workbench-embed`.
- `collection-presenter` and `collection-account` mounted inside shell but still leaned on standalone-first sizing defaults (`min-height: 100vh`) without an explicit embedded presentation toggle.
- Shell adapter attribute mapping was not fully consistent across all four apps (legacy embed attribute mapped for browser/manager, not presenter/account).

## Improvements made in this pass

This pass keeps behavior stable and focuses on shell/app seams:

1. **Adapter consistency across all four mounted apps**
   - Standardized adapter mapping so all four shell sections receive the same compatibility embed attribute (`data-workbench-embed`) in addition to runtime attributes from the mount contract.

2. **Browser embedded seam alignment**
   - Browser shell styles now treat `data-oc-app-mode="embedded"` and `data-shell-embed` as first-class embedded signals (while keeping `data-workbench-embed` support).

3. **Account embedded seam alignment**
   - Account root now explicitly detects embedded runtime using shared mount semantics (`data-oc-app-mode`, `data-shell-embed`) with legacy compatibility support.
   - Account now toggles a presentation attribute (`data-app-presentation-embedded`) to keep standalone defaults while applying embedded layout behavior inside app-shell.

4. **Presenter embedded seam alignment**
   - Presenter shell styles now recognize the same embedded runtime attribute set and avoid standalone-height assumptions when shell-hosted.

## Ownership alignment status after this pass

### Shell-owned

- App switching/navigation across Browse/Collect/Present/Account.
- Embedded mount orchestration and runtime-mode attribute wiring.

### App-owned (intentionally retained)

- Browser manifest loading/recent URL/selection/viewer workflows.
- Manager collection editing/publishing workflows and compatibility connection fallback behavior.
- Account connections and settings page behavior.
- Presenter scaffold content and presenter-specific future capability cards.

No business workflow logic was moved between apps in this pass.

## Standalone vs embedded behavior model (current)

- **Standalone**: each app preserves existing standalone-first defaults and direct entry HTML bootstraps.
- **Embedded inside app-shell**: apps now consume a cleaner, more consistent embedded signal set (`data-oc-app-mode="embedded"`, `data-shell-embed`, legacy `data-workbench-embed`) and adjust only host-boundary layout/presentation behavior.

## Next safest cleanup step

Introduce a tiny shared app-shell-family helper for runtime presentation detection (for example `isEmbeddedRuntimeFromElement(element)` in shared runtime/foundation), then incrementally adopt it in browser/account/presenter/manager to remove repeated attribute checks while preserving the same compatibility behavior.
