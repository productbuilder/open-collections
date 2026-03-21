# Asset Authority, Hosting Responsibility, and Reuse

## 1. Purpose

Open Collections Protocol supports both:

1. **authoritative publication**, where a publisher is asserting responsibility for a collection or asset description, and
2. **reuse**, where a publisher references or incorporates assets or metadata originating elsewhere.

These roles MUST be distinguished clearly enough that consumers can determine:

- who is authoritative for the collection record,
- who hosts the asset bytes,
- who declares the rights status,
- and whether a given asset is primary publication or reuse.

## 2. Roles

The following roles are defined for clarity:

### 2.1 Collection Publisher
The party that publishes a collection manifest and is responsible for the statements made in that manifest.

### 2.2 Asset Host
The domain or service that makes the asset bytes publicly retrievable at an asset URL.

### 2.3 Rights Declarer
The party that provides the rights statement, license, public-domain assertion, or other usage basis associated with an asset.

### 2.4 Reusing Publisher
A collection publisher that references an asset or item record that originates from another publisher or host.

These roles MAY be fulfilled by the same party, but they MUST NOT be assumed to be identical.

## 3. Normative principles

### 3.1 Authority and reuse
A collection MAY include assets or item references that it does not own, originate, or host.

If a collection includes reused assets or reused item descriptions, it SHOULD identify that reuse explicitly.

A collection publisher MUST NOT imply primary ownership, authorship, or rights control over a reused asset unless it is true.

### 3.2 Hosting responsibility
A party that publicly hosts asset bytes MUST have a valid basis to do so.

That basis MAY include, for example:

- ownership of the relevant rights,
- permission or license to host,
- statutory permission,
- confirmed public-domain status,
- or another legally valid basis.

A publicly accessible asset host SHOULD publish a machine-readable rights statement, license statement, or public-domain statement for each hosted asset where feasible.

A publicly accessible asset host SHOULD ensure that openly hosted assets are actually permitted to be hosted openly.

### 3.3 Host is not necessarily rights holder
The asset host MUST NOT automatically be interpreted as the copyright holder, rights holder, or authoritative origin of the asset.

Consumers MUST distinguish between:

- the party that hosts the bytes,
- the party that asserts rights information,
- and the party that is authoritative for the source record.

### 3.4 Reuse transparency
When reusing an asset hosted elsewhere, a reusing publisher SHOULD preserve and expose provenance and rights metadata from the source.

When feasible, a reusing publisher SHOULD identify:

- the authoritative source collection,
- the original or canonical item URL,
- the original or canonical asset URL,
- the source of the rights statement,
- and whether the current collection is reusing rather than originating the asset.

### 3.5 Public-domain and open-use assertions
If an asset host makes an asset openly accessible for reuse, the host SHOULD declare one of the following, where applicable:

- a public-domain statement,
- an open license,
- a hosting permission basis,
- a rights reservation,
- or an explicit rights-unknown status.

A host MUST NOT assert public-domain or open-license status without a reasonable basis.

## 4. Recommended data model

Publishers SHOULD include the following fields, or fields with equivalent semantics, at either item level, asset level, or both.

### 4.1 Core authority and provenance fields

- `canonicalUrl`: the canonical URL for the item or manifest
- `sourceCollection`: the authoritative source collection URL or identifier
- `reusedFrom`: the source item or asset URL from which the current record is reused
- `publisher`: the collection publisher responsible for the current record
- `assetHost`: the host or service providing the asset bytes

### 4.2 Rights and usage fields

- `rightsStatement`: a human-readable or machine-readable rights statement
- `license`: the license under which reuse is permitted, if any
- `rightsHolder`: the known rights holder, if known
- `attribution`: attribution text or source attribution
- `rightsBasis`: the basis for the rights declaration or hosting decision

### 4.3 Optional status fields

- `authorityStatus`: one of `authoritative`, `reused`, `aggregated`, or another controlled value
- `rightsStatus`: one of `publicDomain`, `openLicense`, `licensedForHosting`, `restricted`, `rightsUnknown`, or another controlled value
- `hostResponsibilityStatement`: a statement indicating the basis on which the host makes the asset available

## 5. Processing guidance for consumers

Consumers SHOULD treat a collection as authoritative only for the claims it explicitly makes.

Consumers SHOULD NOT infer that a reusing publisher is authoritative for the underlying asset merely because the asset appears in its collection.

Consumers SHOULD preserve provenance chains when re-exporting or re-indexing collections.

Consumers MAY apply stricter trust rules to assets whose rights basis is absent, ambiguous, or contradictory.

## 6. Conformance guidance

A minimally conforming implementation supporting reuse SHOULD:

1. distinguish between current publisher and source publisher,
2. distinguish between asset host and rights holder when known,
3. preserve provenance for reused assets,
4. avoid false implication of ownership or rights control,
5. and expose rights metadata where available.

## 7. Non-normative rationale

This model allows federated collections, mirrors, aggregators, and institutional reuse without forcing all assets to be re-hosted by the original source.

It also supports a practical accountability rule:

- the party that publicly hosts the asset bytes is responsible for having a valid basis to host them openly,
- while the protocol does not require that the host also be the copyright owner.

This separation improves legal clarity, provenance tracking, and downstream trust.
