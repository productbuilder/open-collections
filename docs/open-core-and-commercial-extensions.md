# Open Core and Optional Commercial Extensions

## Overview

A core design principle of LinkedCollections is that the protocol should remain simple and open.

Anyone should be able to:

- publish a collection
- host a collection
- reference external content
- reuse collection data
- participate without requiring a centralized platform

At the same time, the architecture should allow optional extensions for content owners who want more control over usage, licensing, analytics, or payment.

This means the system should support an **open core** with **optional commercial extensions**.

---

# Why This Matters

Many content ecosystems face a tension between two goals:

- open reuse and interoperability
- creator and owner control, attribution, and compensation

If the system is too open, content owners may feel they lose visibility and value.

If the system is too controlled, adoption becomes difficult and the ecosystem becomes centralized.

LinkedCollections should aim for a middle path:

- keep the base protocol lightweight and open
- allow optional services for those who need additional control

---

# The Core Protocol Should Stay Simple

The basic LinkedCollections model should work without additional infrastructure.

A minimal collection should only require:

- a collection manifest
- item references
- media references
- basic attribution and license metadata

Example:

collection.json  
→ items  
→ media URLs

This should work with simple static hosting.

No analytics service, billing system, or commercial platform should be required for participation.

---

# Distributed Ownership

A key advantage of LinkedCollections is that content can remain hosted by its owner.

Example:

Collection A  
→ references media hosted by Museum B

In this model:

- the collection can reuse the object
- the owner keeps control of the source URL
- the owner can update or remove the resource
- the owner can observe requests made to the resource

This is important because it allows attribution, licensing, and potential analytics to stay with the original source.

---

# Optional Tracking

If content remains hosted by the owner, the owner may choose to track requests to that content.

Examples of trackable resources include:

- collection manifests
- item detail files
- thumbnails
- media assets
- IIIF image endpoints
- download endpoints

Tracking requests may provide:

- usage analytics
- popularity insights
- provenance visibility
- reporting for institutional or commercial use

This tracking should be considered an optional extension, not a core requirement of the protocol.

---

# Optional Licensing

Some content owners may want to attach explicit licensing or usage terms to their content.

Examples include:

- open licenses
- institutional terms of use
- commercial licenses
- metered access for high-resolution content

The core protocol should support linking to licensing information, but it should not require a central licensing platform.

Example concept:

- thumbnail is openly available
- full-resolution file requires a specific license
- download endpoint points to the owner’s own licensing workflow

---

# Optional Billing and Monetization

Some content owners may want to charge for access or usage.

Possible future models include:

- paid downloads
- metered API usage
- license-based access
- subscription models
- commercial access to high-resolution files

These capabilities should be implemented as optional add-ons.

They may be:

- self-hosted by the content owner
- provided by a cloud service
- provided by a third-party service provider

The protocol itself should remain neutral and not depend on any single commercial operator.

---

# Progressive Capability

A useful way to understand this architecture is as a layered system.

## Layer 1 — Open Collections

The base protocol supports:

- collection manifests
- item references
- media references
- attribution
- licensing metadata

This layer is fully open and easy to adopt.

## Layer 2 — Attribution and Provenance

Collections may include:

- creator
- institution
- source
- license

This helps content travel with its provenance.

## Layer 3 — Optional Usage Tracking

Owners may log requests to their resources.

This can provide analytics and visibility.

## Layer 4 — Optional Commercial Services

Owners may attach:

- license endpoints
- billing endpoints
- gated download services
- subscription or token access

These services are optional extensions.

---

# Self-Hosted or Federated Services

If commercial features are added, they should be possible without requiring a central organization to own the ecosystem.

A healthy future model would allow:

- self-hosted tracking services
- self-hosted licensing services
- cloud-hosted services chosen by the owner
- competing third-party service providers

This preserves decentralization while still allowing commercial participation.

---

# Important Design Principle

LinkedCollections should define the protocol for publishing and linking collections.

It should not require a built-in business model.

Instead, the architecture should make room for:

- open participation
- institutional use
- non-commercial use
- commercial extensions

This keeps the ecosystem flexible and future-proof.

---

# Relationship to the Web

This follows the same pattern as the Web itself.

The Web core is simple:

- URLs
- HTTP
- HTML

Optional layers were added later:

- analytics
- advertising
- subscriptions
- paywalls
- hosting services

LinkedCollections should follow a similar pattern:

- simple collection protocol first
- optional service ecosystem later

---

# Guiding Principle

A good guiding principle is:

Keep the protocol simple enough that anyone can publish and use collections.
Allow optional services for analytics, licensing, and billing without making them mandatory.

Another way to say this:

Open participation is the foundation.
Commercial services are optional extensions.

---

# Conclusion

LinkedCollections should begin as a lightweight, open protocol for publishing reusable collection data.

If the ecosystem gains traction, additional services such as tracking, licensing, and billing can be layered on top.

These services should remain optional, federated, and ideally self-hostable, so that creators and institutions can choose the level of control they need without sacrificing openness.

---

End of document.
