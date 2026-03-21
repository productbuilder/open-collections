# Collection Capability Tiers

## Problem framing

Open Collections needs a practical model for what it means to let people “create collections.” That phrase can describe several very different product and operational commitments.

At one end, users may only need to create collection records, add metadata, organize items, and point to media that already exists elsewhere. At the other end, they may expect Open Collections to accept, process, store, serve, moderate, and delete large volumes of uploaded media.

Those are not the same service.

Open Collections should standardize the collection and publication model more than it standardizes storage. Media can remain in existing systems while collection metadata, structure, and publishing behavior stay clean and consistent.

This distinction matters for product strategy, implementation planning, hosting cost, moderation, legal exposure, and pricing.

## Why lightweight collections are easy to host

Lightweight collection creation is relatively cheap and straightforward to support when users mainly:

- create collection records
- add metadata
- organize items and relationships
- reference existing media URLs
- avoid uploading large media files into Open Collections itself

This model keeps the platform focused on structured data and publication logic instead of bulk asset hosting.

### Why this scales well

Metadata is usually small. Collection manifests, descriptive fields, ordering, annotations, and links are inexpensive to store and move compared with images, audio, video, or other user-uploaded assets.

That means Open Collections can support more users with less infrastructure when the default product path is metadata-first. The platform can spend more of its effort on collection structure, editing, publishing, discovery, and interoperability instead of raw storage operations.

### Strategic advantage

This is the simplest default path:

- lower hosting cost
- lower bandwidth use
- simpler backups
- easier portability
- easier multi-tenant scaling
- clearer product boundaries

For many use cases, creating collections does not need to mean uploading everything into Open Collections.

## Why referenced media should be the default path

Reusing existing public media URLs is the best default for a broad public product.

In this model, users create the collection metadata and structure in Open Collections while referencing media that is already hosted elsewhere. That media may live on publisher websites, institutional systems, public object storage, Git-based repositories, or other stable public URLs.

### Benefits of referenced media

Referenced media lowers the burden in several ways:

- lower storage cost, because Open Collections does not have to retain every uploaded asset
- lower bandwidth burden, because origin media can remain on existing hosts
- lower moderation burden, because Open Collections is not the primary upload target for arbitrary public files
- lower copyright and takedown burden, because the system is not automatically taking custody of every file
- easier onboarding, because users can start with what they already have
- easier publishing, because collections can be assembled from existing assets and shared quickly

This also fits the broader project direction: Open Collections should help standardize how collections are described and published, while allowing media to stay in systems that already manage it.

### Product interpretation

Open Collections should treat metadata-first, referenced-media collections as the easiest public workflow to understand and adopt.

Users should be able to make a useful collection without assuming that they must upload all media into the platform.

## Why user-uploaded media is a different operational tier

If Open Collections stores arbitrary uploaded media from random users, it takes on a very different level of responsibility.

This is not just “more of the same.” It is a separate product tier with different cost, policy, and operational implications.

### Additional burdens introduced by hosted uploads

If Open Collections becomes the storage host for uploaded media, it must handle:

- ongoing storage growth
- bandwidth and egress costs
- image/video processing and thumbnail generation
- file validation and malware or abuse controls
- moderation workflows
- copyright disputes and takedown handling
- deletion, retention, and recovery concerns
- quota enforcement
- more complex support and incident response

These requirements change the system from a lightweight collection platform into a media-hosting service.

### Product consequence

Because of that operational shift, hosted uploads should not be treated as the default assumption behind “create a collection.”

Hosted media storage may still be valuable, but it should be intentionally scoped, priced, moderated, and governed as a separate service level.

## Recommended 3-level capability model

Open Collections should describe collection creation through three capability levels.

### Level 1 — Referenced media collections

Users can:

- create collections
- add metadata
- organize items
- reference existing public media URLs
- publish lightweight collections

This should be the best default public path.

It is the easiest model to host, the easiest model to explain, and the most scalable option for broad adoption. It supports many real-world collection use cases without requiring Open Collections to become the primary asset host.

### Level 2 — User/team-managed storage collections

Users or teams connect storage they already control, such as:

- GitHub
- S3-compatible object storage
- local or publisher-managed hosting
- bucket-backed storage

In this model, Open Collections helps users manage collection structure, metadata, and publishing flows, but the underlying media storage remains user-owned or team-owned.

This is an advanced but very important path. It supports publishers, institutions, teams, and serious projects that want stronger control over media, retention, access, and costs without forcing Open Collections to host everything directly.

### Level 3 — Open Collections-hosted media collections

Open Collections itself stores uploaded media.

This should be documented and designed as:

- a separate and more operationally expensive tier
- more restricted than the default workflow
- likely quota-limited, moderated, invite-only, paid, or otherwise controlled

This capability may still be important for some users, but it should not define the baseline product expectation.

## Product recommendation

Open Collections should make lightweight metadata-first collections the easiest path.

Specifically, the product should:

- make referenced media collections the default onboarding and publishing flow
- strongly support metadata, structure, and linked media as first-class capabilities
- support connected user/team storage as the main advanced path
- treat Open Collections-hosted media as a separate service tier rather than the standard assumption

This keeps the product aligned with a strategically attractive hosting model: lightweight where possible, storage-integrated where needed, and platform-hosted media only when intentionally justified.

## Implications for UI, onboarding, pricing, and moderation

### UI and onboarding

Default onboarding should encourage linked or referenced media collections.

The first-run experience should make it obvious that users can build collections by adding metadata, organizing items, and linking to existing media. Connecting external or team-managed storage can be presented as an advanced option for users who need more control.

Hosted uploads, if offered, should appear as a distinct mode with clear expectations rather than as the default starting point.

### Pricing and packaging

The capability model suggests natural tiering:

- Level 1 can be broad and lightweight
- Level 2 can support advanced publishing and integration workflows
- Level 3 may require paid plans, quotas, approvals, or tighter limits because it carries the highest ongoing cost

### Moderation and policy

Storage and liability should shape product tiers.

The more Open Collections directly stores and serves user-uploaded media, the more it needs moderation systems, enforcement processes, abuse response, and legal handling. That makes Level 3 a policy-heavy service compared with Levels 1 and 2.

## Conclusion

Creating collections does not have to mean uploading all media to Open Collections.

Many users only need metadata, structure, and links to existing assets. Supporting that well makes the platform easier to run, easier to scale, and easier to explain.

Open Collections should therefore treat lightweight metadata-first collections as the default model, support connected storage as the key advanced path, and scope platform-hosted media as an intentional, separate tier rather than the baseline definition of collection creation.
