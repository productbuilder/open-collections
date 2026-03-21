# Ideal Bucket-Backed Shared Asset System

## Purpose

This note describes an ideal future shared asset system built around bucket-backed storage, local working copies, and a desktop-first workflow.

The intent is to define a broader foundation that can support both Productbuilder and Open Collections.

It is not a collection-only proposal. Instead, it describes a general shared asset and workflow backbone that Open Collections can build on top of as one domain layer.

This is an internal planning note, not a finalized technical specification.

## 1. What problem this system solves

We want a shared asset system that supports:

- bucket-backed file storage as the canonical shared source of truth,
- internal team workflows,
- external freelancer workflows,
- faster browsing and filtering than raw bucket listing,
- safer local working-copy workflows instead of direct editing against remote files,
- and a reusable backbone that can serve both Productbuilder and Open Collections.

Today, raw bucket storage or mounted-drive access can hold the files, but it does not provide the full working model we want. We need a system that makes shared assets easy to discover, safe to work on locally, and easier to coordinate across multiple users and teams.

The system should therefore separate:

- canonical remote storage,
- local working state,
- high-performance local indexing,
- and later multi-user workflow coordination.

That separation gives us a clearer architecture than treating a bucket, a mounted drive, or a collection manifest as the whole product.

## 2. Core principle

The ideal model is a deliberate split between canonical remote storage, local working copies, and higher-level domain behavior.

The core principles are:

- bucket storage is the canonical shared source of truth,
- users work on explicit local copies rather than editing raw remote files directly,
- the desktop app is the primary browse and workflow client,
- local SQLite provides the performance, indexing, and cache layer,
- and collections are not the whole system, but one domain built on top of this shared asset core.

In this model, the bucket is where shared canonical assets live, but the app is where people actually understand and manage work. The local machine is where active editing happens. SQLite exists to make the client fast and stateful, not to replace the bucket as the authoritative store.

## 3. Proposed ideal architecture

### A. Canonical storage layer

The canonical storage layer is one or more buckets that hold the shared remote assets and files.

This layer should provide:

- canonical remote storage for asset bytes and related files,
- predictable folder or prefix structure,
- stable paths or identifiers where possible,
- and a storage model that can scale across different projects, teams, and domains.

The bucket structure should be organized enough that the desktop client can index it reliably. That does not require a heavy backend by default, but it does require conventions for paths, prefixes, and object identity.

### B. Desktop working client

The primary user experience should live in a Tauri desktop app.

The desktop app should be the main environment for:

- browsing shared assets,
- searching and filtering,
- understanding asset status,
- checking files out to local workspaces,
- checking files back in,
- and exposing higher-level workflows built on top of the shared asset system.

This should be a local-first user experience even when the canonical source of truth is remote. Users should feel like they are working in a responsive local application, not browsing a thin wrapper around a bucket API.

### C. Local database and index layer

SQLite should act as the local index, cache, and workflow-state layer inside the desktop client.

This layer should support:

- local indexing of remote assets,
- cached folder and prefix views,
- fast search and filtering,
- recent activity and browsing history,
- working-copy tracking,
- and sync-related metadata.

This is the layer that makes large shared storage usable in practice. It should allow the app to feel much faster than raw remote listing while still remaining subordinate to canonical bucket storage.

### D. Optional coordination layer

A lightweight coordination layer can be added later when the workflow needs it.

That layer could include a small server and database responsible for:

- permissions,
- user roles,
- locking or reservations,
- audit history,
- workflow state,
- and broader multi-user coordination.

This layer should be optional in the early phases. The initial model should not depend on a heavy central backend unless the collaboration needs actually require it.

### E. Open publish and output layer

Open Collections should still publish portable open outputs rather than collapsing everything into an internal application database.

That means the higher-level output layer can still produce artifacts such as:

- `collection.json`,
- media references,
- static website packages,
- and other portable publishable outputs.

This keeps the shared asset core distinct from the publish format. The internal workflow system can be richer, while the published outputs remain portable, inspectable, and open.

## 4. Why not rely only on mounted drives

Mounted drives may remain useful, but they should not be the primary workflow model.

They are helpful because they can expose remote storage in a familiar way, but they have important limitations:

- local versus remote state is often unclear,
- collaboration state is unclear,
- performance is typically weaker than a purpose-built local index,
- and check-in or check-out semantics are implicit rather than explicit.

A mounted drive makes remote files look local, but that can hide the fact that the underlying collaboration model is still unresolved. Users may not know whether a file is safe to edit, whether it is cached, whether someone else is working on it, or whether changes are fully synchronized.

For that reason, mounted-drive access is better treated as a secondary or advanced access mode, not the primary workflow model. The primary model should make local copies, sync status, and shared ownership much more explicit.

## 5. Working-copy model

The ideal workflow is based on explicit local working copies.

A typical workflow would be:

1. browse shared storage through the desktop app,
2. select a file, group of files, or a folder,
3. download or check those files out into a local workspace,
4. work locally using normal tools,
5. upload or check changes back into the canonical bucket,
6. and let the app track sync state, local status, and any workflow metadata.

This model is safer and easier to reason about than editing remote files in place. It creates a clear distinction between:

- canonical shared state in the bucket,
- local working state on the user machine,
- and synchronization between the two.

It also creates a more natural foundation for later features such as explicit reservations, review states, conflict handling, and activity history.

## 6. Role of SQLite

SQLite has a very important role in this system, but it is not the system's source of truth.

In the ideal model, SQLite is responsible for:

- storing a local index of remote assets,
- caching folder and prefix structure,
- enabling fast search and filtering,
- tracking recent activity,
- tracking local working copies,
- and storing sync or check-out metadata needed by the desktop client.

SQLite should make the client fast, queryable, and stateful even when the canonical asset set is remote and large.

Just as importantly, SQLite is **not**:

- the canonical source of truth,
- the published collection format,
- or the shared collaboration backend by itself.

The bucket remains authoritative for canonical shared files. Published outputs remain portable files. If we later need shared multi-user coordination, that likely belongs in an additional coordination layer rather than trying to force SQLite to act as a multi-user server.

## 7. Shared core vs. domain-specific layers

The shared asset system should remain general enough to support multiple domains.

At the core level, it should support workflows such as:

- Productbuilder asset organization,
- Productbuilder internal production workflows,
- Open Collections asset preparation,
- and broader shared-file collaboration patterns that are not specific to collections.

Open Collections should then sit on top of this as a higher-level domain layer.

That domain layer can add concepts such as:

- datasets,
- curated collections,
- collection items,
- publishing workflows,
- linked or reused collections,
- and later annotations, relations, or other curatorial structures.

This separation matters because it prevents Open Collections from defining the entire storage and workflow architecture too narrowly. The shared system should be useful even outside a collection context, while Open Collections can provide domain-specific structure on top of it.

## 8. Ideal user groups and responsibilities

The system should support multiple user groups with different responsibilities.

### Internal team members

Internal team members need a fast and reliable environment for day-to-day asset work, review, organization, and production.

### External freelancers

External freelancers need scoped access to specific assets or work areas without requiring full infrastructure ownership or broad storage visibility.

### Infrastructure and admin roles

Infrastructure or admin roles are responsible for bucket setup, access policies, storage conventions, and eventually any coordination-layer configuration.

### Collection and curation teams

Collection and curation teams are responsible for higher-level organization, interpretation, publishing decisions, and the Open Collections-specific domain workflow.

The system should preserve a clean separation between:

- infrastructure setup,
- day-to-day asset work,
- and curation or publishing workflows.

That separation allows the platform to scale more cleanly. Not everyone who works on assets should also need to define bucket structure or publishing behavior, and not every curator should need infrastructure-level access.

## 9. Benefits of this model

This model offers several important benefits:

- faster browsing through local indexing and caching,
- clearer distinction between local work and canonical remote state,
- a better foundation for collaboration,
- more explicit check-in and check-out behavior,
- easier scaling across larger asset sets and more users,
- a reusable foundation across Productbuilder and Open Collections,
- and continued support for open, portable collection outputs.

It also lets us evolve carefully. We can start with a bucket plus desktop app model, then add workflow semantics and coordination only when they become necessary.

## 10. Suggested phased implementation

A likely staged path could look like this:

### Phase 1: bucket + desktop client + local SQLite index

Start with canonical bucket storage, a desktop browsing client, and a local SQLite index for speed and discoverability.

### Phase 2: explicit local working copies and sync state

Add clear local workspaces, download or check-out flows, upload or check-in flows, and visible sync state.

### Phase 3: shared workflow and status semantics

Add lightweight status concepts such as in progress, ready for review, needs upload, or recently changed.

### Phase 4: optional coordination server and database

Introduce a shared server or database only when permissions, roles, locks, audit history, or multi-user coordination justify it.

### Phase 5: richer Open Collections domain layer on top

Build more advanced Open Collections domain behavior on top of the shared core, including curation, publishing, reusable collection structures, and related higher-level workflows.

## 11. Open questions

Several important questions remain open:

- At what point does a shared server database become necessary rather than optional?
- Which permissions should be enforced at the bucket layer versus a coordination layer?
- Which concepts should remain generic across products, and which should be Open Collections-specific?
- How should freelancer access be scoped and provisioned safely?
- How should local workspaces be organized on disk for clarity and scale?
- What level of locking, reservation, or conflict handling is actually needed in practice?

These questions do not block the core direction. They indicate where later architecture decisions will need to become more concrete.

## Summary

The ideal future system is a bucket-backed shared asset and workflow foundation with a desktop-first client, explicit local working copies, and SQLite as the local performance and state layer.

In that model:

- buckets hold the canonical shared files,
- the desktop app is the main place users browse and manage work,
- users edit explicit local copies,
- SQLite makes the experience fast and trackable,
- and Open Collections becomes one higher-level domain built on top of that shared system rather than the whole system itself.

That framing gives us a stronger foundation for later frontend design, workflow semantics, and publish-layer decisions.
