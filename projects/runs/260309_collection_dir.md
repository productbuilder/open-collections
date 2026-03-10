Use this Codex prompt:

````text
You are working in the GitHub repository:

productbuilder/timemap-collector

Goal:
Refine the Collector data model and publish workflow so that collections are treated as real collection directories, not just abstract draft manifests.

Important product direction:
- each collection should have its own root directory/path
- collection assets and metadata should live inside that collection root
- publishing should target:
  - one selected writable storage source
  - one selected collection at a time
- Collector should edit one collection at a time
- a newly created collection should not ambiguously reuse a shared root `collection.json`
- assets dropped into a collection should belong to that collection’s own structure

This task should make the collection model much clearer and more realistic for actual publishing.

---

## Core model to implement

Collector should work with the following concepts:

### 1. Storage source
A writable storage location, for example:
- GitHub repo
- future S3 bucket/prefix
- future WordPress source

A storage source may contain multiple collections.

### 2. Collection
A collection inside a storage source.

Each collection has:
- collection id / slug
- collection root path
- collection manifest
- media assets
- thumbnails

### 3. Active working context
Collector should operate on:
- one selected storage source
- one selected collection

at a time.

This should simplify the authoring model.

---

## Collection directory model

Each collection should conceptually map to a directory-like root.

Recommended structure:

```text
<collection-slug>/
  collection.json
  media/
  thumbs/
````

So for a collection like:

`harbor-collection`

the intended publish structure becomes:

```text
harbor-collection/
  collection.json
  media/
    image-001.jpg
  thumbs/
    image-001.jpg
```

This structure should guide:

* local draft logic
* upload targets
* manifest asset paths
* publish behavior

You may adapt the exact naming slightly if the existing implementation already uses a better pattern, but keep the same principle:
**each collection has its own root directory**.

---

## What to implement

### 1. Add collection root path to the collection model

Extend the collection draft model so each collection explicitly tracks its own root path / collection directory.

For example, a collection should now conceptually include fields such as:

* id
* title
* description
* rootPath or collectionRoot
* items[]

A reasonable default for a new collection is:

* `rootPath = <collection-id>/`

If the current draft model does not include this yet, add it cleanly.

### 2. Ensure new collections get their own directory namespace

When a user creates a new collection from scratch:

* generate a collection id/slug
* generate a collection root path
* do not treat it as reusing a shared/global `collection.json`
* initialize it as its own publishable collection unit

For example:

* title: `Harbor Collection`
* id: `harbor-collection`
* rootPath: `harbor-collection/`

This should become the default namespace for:

* `collection.json`
* uploaded media
* thumbnails

### 3. Make asset ingestion target the active collection root

If the app already supports or is about to support drag/drop upload:

* dropped images should be added to the currently active collection
* generated media paths should be scoped to that collection root

For example:

* original:

  * `harbor-collection/media/harbor-map.jpg`
* thumbnail:

  * `harbor-collection/thumbs/harbor-map.jpg`

Do not treat uploads as global/unscoped assets.

If drag/drop is not yet implemented in the current branch, still update the draft model and path logic so the future ingestion flow has the correct target structure.

### 4. Update manifest path generation

When generating or updating `collection.json`, asset references should resolve relative to the collection root cleanly.

Example item media references could become:

```json
{
  "id": "harbor-map",
  "media": {
    "type": "image",
    "url": "media/harbor-map.jpg",
    "thumbnailUrl": "thumbs/harbor-map.jpg"
  }
}
```

The collection root should define the directory context in which these paths live.

Keep the manifest self-contained and portable.

### 5. Make publish target selection explicit

Refine the publish flow so the user clearly selects:

* one storage source
* one collection

The Collector should be working on one collection at a time.

Recommended behavior:

* user chooses writable storage source
* user chooses collection directory/root (existing or new)
* publish writes into that collection root

For the first pass, a clean practical approach is enough.

Examples:

* selected source: `productbuilder/timemap-data`
* selected collection: `harbor-collection`

Then publish writes:

```text
harbor-collection/collection.json
harbor-collection/media/...
harbor-collection/thumbs/...
```

### 6. Represent collections per storage source more clearly in the UI

Update Collector so the concept of collections inside a source is clearer.

At minimum:

* selected source is visible
* selected collection is visible
* collection switching is possible if multiple collections exist
* creation of a new collection clearly belongs to the selected source or local draft context

A simple UI is fine, such as:

* source selector
* collection selector

Do not overdesign this.

### 7. Keep local drafts compatible with this structure

If OPFS/local drafts exist:

* local draft collections should also follow the same collection-root concept
* local draft files should know which collection root they represent
* restoring a draft should restore the selected collection and its pathing model

This should help ensure the local model matches the published model.

### 8. Preserve current editing functionality

Do not break:

* metadata editing
* card grid
* image viewer
* source manager
* local draft restore
* publish/export

This task should clarify the collection model, not rewrite the whole app.

---

## Suggested UX direction

Collector should feel like it is editing a real collection workspace.

A good mental model is:

```text
Storage: productbuilder/timemap-data
Collection: harbor-collection
```

And the current workspace always belongs to that one collection.

If helpful, surface this in the header or near the main workspace.

---

## Suggested implementation steps

1. inspect the current collection and publish model
2. add collection root path to the collection draft model
3. update new collection creation to generate its own root path
4. update manifest/path generation to use collection-root-relative structure
5. refine publish flow to target selected source + selected collection
6. update source/collection UI so one storage and one collection are clearly active
7. ensure local draft persistence includes collection root information
8. update docs / implementation notes

Avoid unnecessary rewrites.

---

## Optional enhancements if they fit naturally

If practical, add one or more of these:

### A. Collection root rename safety

If a collection slug changes, either:

* update root path carefully
* or treat root path as stable once created

A simple first rule is acceptable.
For example:

* root path is set on creation and not automatically rewritten later

### B. Existing collection discovery

If GitHub already supports listing multiple collection directories in a repo, surface that.
If not fully implemented yet, scaffold it honestly.

### C. Publish preview

Show a small preview of where files will go, for example:

```text
productbuilder/timemap-data / harbor-collection/
```

This is optional but helpful.

---

## Documentation updates

Update docs briefly where useful, such as:

* README
* implementation notes
* docs page if relevant

Document:

* collections now have explicit collection root directories
* Collector edits one collection at a time
* publishing targets one selected source and one selected collection
* media and thumbs live inside the collection structure

Keep docs concise and honest.

---

## Acceptance criteria

This task is complete when:

1. each collection has an explicit collection root/path concept
2. new collections get their own directory namespace
3. manifest/media/thumb paths are scoped to the collection root
4. publish flow targets one selected source and one selected collection
5. Collector clearly reflects the active storage source and active collection
6. local draft persistence remains compatible
7. existing editing functionality still works

---

## Output requirements

After making the changes:

1. show the git diff
2. summarize:

   * how the collection root/path model was added
   * how new collection creation now works
   * how publish targeting changed
   * how source/collection selection is represented
3. clearly separate:

   * completed functionality
   * remaining limitations
   * recommended next step
4. be honest about any incomplete multi-collection discovery support
5. do not modify unrelated files unnecessarily

```
```
