You are working in the GitHub repository:

productbuilder/timemap-collector

Goal:
Implement saving edited metadata back into a linked GitHub repository when the source was connected using a GitHub Personal Access Token (PAT).

Important:
This should build on the current GitHub provider implementation.
Do not redesign the app.
This task is about making the existing metadata editing flow persist changes back to GitHub.

The current user scenario is:
- the user connects a GitHub repository using a PAT
- the provider loads a `collection.json` manifest from that repo
- the collection may contain inline item metadata
- the user edits metadata in the right-hand metadata editor
- clicking save should write the changes back to the linked GitHub repo

---

## What to implement

### 1. Enable GitHub write capability when a PAT is present

Update the GitHub provider so that if a valid PAT is provided, and the repo/path is accessible, the provider reports write capability.

At minimum, the GitHub provider should expose a capability like:
- `canSaveMetadata: true`

when:
- token is present
- repo is reachable
- collection manifest was loaded from GitHub

If the provider is connected without sufficient permissions:
- keep read-only behavior
- surface a clear status/message

Do not fake write capability if the provider cannot actually write.

---

### 2. Support saving inline item metadata back to `collection.json`

The first required implementation target is collections where items are stored inline in `collection.json`.

Example pattern:
- `collection.json` at repo root or configured folder path
- manifest contains `items: [ { ...inline item... } ]`

When the user edits metadata for an item and clicks save:
- update the in-memory item state
- update the matching item in the in-memory manifest
- write the updated `collection.json` back to GitHub
- create a commit via the GitHub Contents API
- include a reasonable commit message

Suggested commit message:
- `Update metadata for <item-id> via TimeMap Collector`

or
- `Update collection metadata via TimeMap Collector`

The write must include the current file SHA if the GitHub API requires it.

---

### 3. Preserve manifest structure when saving

When saving back to GitHub:
- preserve the existing manifest structure as much as possible
- update only the edited item fields and any necessary collection fields
- do not rewrite the structure unnecessarily
- do not drop unknown fields
- preserve unrelated items in the collection

This is important so the Collector does not damage hand-edited JSON.

---

### 4. Support correct path resolution for `collection.json`

The GitHub provider currently uses:
- owner
- repo
- branch
- folder path

Make sure save logic writes back to the correct manifest path.

Examples:
- root manifest → `collection.json`
- folder path `collections/demo/` → `collections/demo/collection.json`

The provider should use the same resolved path for saving that it used for loading.

---

### 5. Save metadata only for GitHub-backed editable items

The save button in the metadata editor should behave intelligently.

Requirements:
- if the selected item came from a writable GitHub source, saving should write to GitHub
- if the selected item came from a read-only source, show a clear read-only message
- do not attempt GitHub save for non-GitHub items
- preserve current local editing behavior where appropriate

If the workspace contains items from multiple sources:
- save should apply to the selected item’s source
- avoid writing to the wrong source

---

### 6. Provide clear save status feedback

When the user saves metadata for a GitHub-backed item, show useful status feedback.

Examples:
- `Saving metadata...`
- `Metadata saved to GitHub`
- `Save failed: insufficient permissions`
- `Save failed: collection manifest is read-only`
- `Save failed: item not found in manifest`

Keep messages practical and concise.

If possible, expose success/failure in:
- status message area
- metadata editor status
- or lightweight toast/message

---

### 7. Handle GitHub API errors safely

Implement safe error handling for:
- missing token
- invalid token
- insufficient repo permissions
- missing file SHA
- branch/path issues
- concurrent update conflicts
- network/API failures

If save fails:
- keep local edits intact if possible
- do not silently discard changes
- show a clear message

---

### 8. Keep secrets out of persistence

If the app currently remembers GitHub source configuration locally:
- continue remembering non-secret repo configuration
- do NOT persist the PAT
- saving to GitHub should only work when the user has actively provided a valid PAT in the current session, unless a secure storage mechanism already exists

---

## Optional but useful enhancements

If practical, add one or more of these:

### A. Dirty-state tracking
Detect whether the selected item has unsaved changes and reflect that in the UI.

### B. Save button state
Enable/disable Save depending on:
- selected item exists
- item is writable
- changes are present

### C. Last saved info
Show:
- saved to GitHub
- branch/path
- timestamp if useful

These are optional if they fit naturally.

---

## Out of scope for this pass

Do NOT require implementation of:
- OAuth login
- GitHub App auth
- sidecar JSON save support if it complicates the first pass
- bulk save of all items
- multi-file commit workflows
- publish destination architecture redesign

Focus first on:
- inline manifest item editing
- save selected item metadata back to `collection.json`

---

## Suggested implementation approach

1. inspect the current GitHub provider load logic
2. ensure the provider retains enough manifest context to save back:
   - manifest path
   - branch
   - file SHA
   - loaded manifest JSON
3. update provider capabilities to reflect write support when PAT is present
4. implement a provider method like:
   - `saveItemMetadata(...)`
   or
   - `saveCollectionManifest(...)`
5. wire the metadata editor save button to call the provider save method for writable GitHub items
6. update in-memory state after successful save
7. add clear status/error messaging
8. update docs / implementation notes briefly

Avoid unnecessary rewrites.

---

## Testing target

This should work for a real test scenario like:

- provider: GitHub
- owner: `productbuilder`
- repo: `timemap-data`
- branch: `main`
- folder path: `/`
- manifest: `collection.json`
- items stored inline in the manifest

Expected behavior:
- load collection from GitHub
- edit item metadata in Collector
- click save
- changes are committed back to `productbuilder/timemap-data`

---

## Documentation updates

Update docs briefly where needed, such as:
- README
- implementation notes
- docs page

Document:
- GitHub PAT with write permissions is required to save
- inline `collection.json` items are now writable
- PAT is not persisted locally

Keep documentation concise.

---

## Acceptance criteria

This task is complete when:

1. a GitHub-connected inline `collection.json` can be loaded
2. selected item metadata can be edited in the sidebar
3. clicking save writes changes back to GitHub
4. the GitHub provider uses the correct manifest path and file SHA
5. the UI shows save success/failure clearly
6. read-only sources do not pretend to be writable
7. PAT is not persisted locally
8. existing read flows still work

---

## Output requirements

After making the changes:

1. show the git diff
2. summarize:
   - how GitHub write support was implemented
   - how inline manifest saving works
   - how save status/error handling works
3. clearly separate:
   - completed working functionality
   - any remaining limitations
   - recommended next step
4. be honest about any GitHub API or auth limitations
5. do not modify unrelated files unnecessarily