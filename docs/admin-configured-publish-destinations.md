# Admin-configured publish destinations

This note proposes an Open Collections publishing model where a technical or infrastructure manager configures a destination once, and collection teams then publish into that prepared destination through a simple repeatable workflow.

It is intended as an internal product and architecture note to guide future UX, backend configuration, and hosting documentation. It is not a low-level implementation spec.

## Problem this model solves

Many collection contributors should not need to understand or configure:
- repository selection
- bucket selection
- branch details
- folder or prefix rules
- credentials
- deployment mechanics
- public URL mapping

That complexity is real, but it usually belongs to a technical administrator rather than to a curator, librarian, archivist, or collection manager.

A practical product model is to let a technical person connect Open Collections to an organization's chosen hosting or storage setup once, then let normal users publish collections without dealing with infrastructure details each time.

## Proposed model

Open Collections should support **admin-configured publish destinations**.

The core idea is a separation between one-time infrastructure setup and repeatable collection publishing.

### A. Infrastructure/admin setup

A technical or infrastructure manager configures a named destination once. That setup may include:
- storage backend such as a GitHub repository or S3 bucket
- branch, prefix, or folder
- public base URL
- website path such as `/collections/`
- any required credentials or deployment connection
- any organizational defaults or validation rules

This setup produces a destination that is ready for normal publishing use.

### B. Collection publishing by normal users

After setup exists, a collection user should only need to:
- choose a prepared destination
- choose a collection slug or path if needed
- publish or update the collection

In this model, the user is publishing *into* an approved destination, not configuring hosting from scratch.

## Example publish destination model

A destination could look like this:

- **Destination name:** `Example.org Collections`
- **Storage backend:** GitHub repository or S3 bucket
- **Publish path:** `collections/`
- **Public base URL:** `https://example.com/collections/`

A collection user then publishes a collection with the slug:

- `local-history-photos`

The resulting public URL becomes:

- `https://example.com/collections/local-history-photos/`

This is simple for the collection user because the repository, bucket, branch, credentials, and public path mapping have already been handled by the admin configuration.

## Why path-based hosting matters

Collections do not need to live at the root domain to feel official or well integrated into an organization's web presence.

A path-based model is often the most practical fit because organizations may already have:
- a main website at the root domain
- an existing GitHub-backed or static hosting workflow
- a storage bucket or deployment target that maps to a subpath

Common and understandable site paths include:
- `/collections/`
- `/opencollections/`
- `/webcollections/`

Open Collections should likely prefer `/collections/` as the default suggested path because it is short, clear, and neutral, while still allowing the other patterns when they better match local conventions.

## Product UX implications

This model should shape the product experience in a direct way.

Normal users should select a named destination, not a raw repository, bucket, branch, or credential set.

For example, the UI might present:
- `Publish to Example.org Collections`

The publish flow should feel like:
1. Choose destination.
2. Choose collection slug or path.
3. Publish.

The user should also see the resulting public URL clearly before and after publishing.

A good UX outcome is that publishing feels closer to selecting a site location than to configuring infrastructure.

## Roles and responsibilities

This model creates a useful separation of responsibilities.

### Infrastructure/admin responsibilities
- connect Open Collections to the chosen storage or hosting target
- define branch, folder, prefix, or path conventions
- manage credentials and permissions
- confirm how public URLs are formed
- maintain organizational publishing standards

### Collection team responsibilities
- prepare collection content and metadata
- choose the prepared destination
- choose the collection slug or allowed path segment
- publish updates over time

This separation fits organizations where one technical staff member sets up infrastructure, but ongoing publishing is handled by curators, editors, or collection managers.

## Benefits

Benefits of this model include:
- simpler publishing for non-technical users
- fewer configuration mistakes
- more consistent URL structure across collections
- easier adoption within institutions
- better alignment with existing domains and websites
- clearer organizational ownership of hosting configuration
- a more repeatable publishing workflow for many collections over time

## Relationship to other Open Collections publish paths

This should be treated as a strong and practical publishing model, not as the only model.

It can live alongside other Open Collections publish paths such as:
- website package export
- direct WordPress or CMS integration
- advanced self-configured storage targets for technical users

That flexibility matters because different organizations will prefer different operating models, but admin-configured destinations may be one of the best defaults for institutions that want predictable publishing without exposing infrastructure complexity to every user.

## Open questions and follow-up

Questions for later product and implementation work include:
- should destinations be organization-level, workspace-level, or user-level?
- should one destination support multiple public site paths?
- should collection users edit only the final slug, or also controlled subpaths?
- how should credentials and permissions be stored and managed?
- should the UI show root domain plus recommended path presets?
- how should validation work when a slug conflicts with an existing published collection?
- what publishing history or rollback controls should be visible to admins versus normal users?

## Working recommendation

Open Collections should explore admin-configured publish destinations as a primary institutional publishing model:
- technical staff handle destination setup once
- collection staff publish repeatedly into that destination
- the product presents named destinations and clear resulting URLs

This framing is concrete enough to guide future UX and backend work, while still leaving room for implementation choices and additional publishing models.
