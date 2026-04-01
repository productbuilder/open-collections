# Branch Regression Audit — 2026-04-01

## Scope reviewed
- `src/apps/collection-presenter/*`
- `src/apps/collection-manager/*`
- `src/apps/collection-account/*`
- `src/apps/app-shell/*`
- Related manager session restore logic in `workspace-controller`

## 1) Confirmed or likely regressions

### A. App-shell drops navigation intent payload from Collect → Account (confirmed)
- **Affected surfaces:** app-shell navigation/session behavior, Account entry flow from Collect.
- **Severity:** High (breaks intended cross-app deep-link behavior).
- **Files/functions:**
  - `src/apps/collection-manager/src/app.js` → `requestAccountConnectionsNavigation()` emits rich `detail` (`targetSection`, `intent`, `sourceId`, etc.).
  - `src/apps/app-shell/src/index.js` listener handles only `targetAppId` and discards remaining detail.
- **Likely cause:** Host listener in app-shell currently only switches section and never forwards or applies navigation intent metadata.
- **Classification:** **Pre-existing migration gap exposed now** (not introduced by latest Present file edits, but directly impacts current session behavior).

### B. Present edit flow does not recompute title/description from updated labels (confirmed)
- **Affected surfaces:** Present card metadata after editing time-comparer settings.
- **Severity:** Medium.
- **Files/functions:**
  - `src/apps/collection-presenter/src/app.js` → `saveTimeComparerItem()`.
- **Evidence:** During edit mode, `savedItem.title` and `savedItem.description` preserve `existingItem` values when present, so updated labels do not flow through to displayed title text.
- **Likely cause:** edit implementation reuses existing metadata too aggressively.
- **Classification:** **Present-scope regression** (introduced with recent edit-flow enhancement work).

### C. Present add/edit remains memory-only and not integrated with shared connection/session runtime (likely, high confidence)
- **Affected surfaces:** Present vs Collect/Account compatibility expectations; persistence/session continuity.
- **Severity:** Medium-High (user-visible data continuity gap).
- **Files/functions:**
  - `src/apps/collection-presenter/src/app.js` loads fixed JSON via `DEFAULT_PRESENTATIONS_URL` + `fetch()`, mutates only local `this.state.items`/`this.state.collection.items` in `saveTimeComparerItem()`.
- **Likely cause:** Present currently works as isolated local UI state and does not write through manager/account runtime/storage pathways.
- **Classification:** **Pre-existing but exposed now** (the new Add/Edit flow makes this gap much more visible).

### D. Guardrail scope was violated by earlier "Restrict time comparer creation" merge (confirmed scope leak)
- **Affected surfaces:** Collect (collection-manager) behavior + ownership boundaries.
- **Severity:** Medium (process/scope regression; functional effect already landed in Collect).
- **Files/functions:** out-of-scope edits landed in manager-side create/wiring paths during the Present rollout period.
- **Likely cause:** Nearby merge/conflict resolution while implementing Present flow.
- **Classification:** **Merge/conflict-adjacent regression** (scope/process break with real code impact outside `collection-presenter`).

## 2) Highest-confidence current bug

**App-shell navigation intent drop (Collect → Account).**

Reason: code path is explicit and deterministic — manager emits rich navigation detail, app-shell intercepts and only toggles to `account`, ignoring `targetSection`/`intent`, so deep-link semantics are lost every time.

## 3) Recommended fix order (safest patch sequence)

1. **Fix app-shell NAVIGATE intent forwarding/consumption first** (restore cross-app routing contract without touching data models).
2. **Fix Present edit metadata update logic** (title/description behavior) in a small isolated patch.
3. **Decide and implement Present persistence contract** (either explicitly keep ephemeral with clear UX copy, or wire to shared runtime/storage).
4. **Scope hygiene follow-up:** isolate/annotate manager-side out-of-scope changes from Present stream to reduce future regression ambiguity.

## 4) Scope safety notes

- Intended guardrail was Present-only (`src/apps/collection-presenter/*`).
- Current branch history in this implementation window includes manager-side edits, so the rollout was not fully scoped.
- The known manager startup candidate (`restoreRememberedSources` early-return on empty restore) appears to be addressed in current code by fallback source creation path, and is not the strongest active regression in the current snapshot.
