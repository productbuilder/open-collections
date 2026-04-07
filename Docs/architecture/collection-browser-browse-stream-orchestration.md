# Browse Stream Orchestration

## Purpose

This document defines the intended orchestration model for the mixed Browse stream (Sources, Collections, Items).

It is written for two horizons:

- near-term frontend-only prototyping in the current codebase
- later backend-supported production orchestration

## Current implementation reality

The current system context is frontend-only and browser-constrained.

That means today:

- candidate generation is client-side
- ranking and feed assembly are client-side
- exposure memory is local to the browser/user session
- fairness and novelty are approximate per-client behaviors
- global orchestration is limited without backend coordination

This is still worth building now because it validates the browse model and preserves a clean migration path.

## Core problem

The Browse stream cannot be a naive flat list of all available content.

Current browse entities are:

- sources
- collections
- items

Preferred manifest entry pattern in most cases:

- start from `source.json` to preserve richer source context through candidate generation and feed assembly
- allow direct `collection.json` or item-level loading where appropriate, with explicit source-context enrichment when browse UI/orchestration needs that context

A naive flat stream fails because:

- item counts are usually much larger and will dominate quickly
- large sources can crowd out smaller sources
- identity and orientation are lost, turning Browse into generic image scrolling
- users need both discovery and context
- streams that do not renew become stale and reduce return value

## Core principle

The Browse stream should be generated as a mixed feed assembled from separate candidate pools, not a single flat ranked list.

The stream should intentionally balance:

- source cards
- collection cards
- item cards

And also balance across:

- source diversity
- freshness
- novelty
- prior exposure
- quality and editorial value

The system should optimize for:

- breadth
- rhythm
- fairness
- surprise
- continued return value

Not simply "top ranked items overall".

## Recommended orchestration model

Use a two-stage model.

### Stage A: Candidate generation

Build separate candidate pools for:

- sources
- collections
- items

### Stage B: Feed assembly

Assemble the next feed window from those pools using:

- type quotas
- diversity constraints
- repetition penalties
- pacing rules

This conceptual model should remain stable whether execution is frontend-only now or backend-assisted later.

## Proposed default mix (starting point)

Initial target mix for experimentation:

- 15-20% source cards
- 35-40% collection cards
- 40-50% item cards

Rationale:

- sources provide identity and orientation
- collections provide bundled entry points
- items provide visual energy and abundance
- items should be underrepresented relative to raw count

These are starting values, not fixed product truth.

## Source balancing is first-class

With roughly 10-20 sources, source balancing is a core browse requirement.

The stream should:

- prevent domination by very large sources
- maintain minimum visibility for smaller sources
- apply source-aware exposure balancing
- treat source size as availability, not direct visibility entitlement

Source fairness is part of browse quality, not only a technical optimization concern.

## Novelty and renewal over time

Browse should feel renewable so users have a reason to return.

Exposure memory should track at least:

- what was shown in the current session
- what was shown recently
- what was shown over a longer window

In a frontend-only prototype this can start with:

- in-memory session state
- local storage or browser storage
- lightweight client-side history windows

Later this can move to backend-managed shared exposure data.

## Frontend-only constraints and value

### Constraints today

- orchestration quality is per-client, not globally coordinated
- cross-user fairness cannot be guaranteed
- large-scale freshness windows are harder to maintain
- memory resets are tied to client/browser behavior

### Why still build now

- validates mixed feed behavior
- validates source balancing heuristics
- validates renewal and repetition controls
- de-risks card-type pacing decisions
- defines stable seams for later backend migration

## Migration path to backend orchestration

When backend support is introduced later, keep the conceptual model stable and move execution responsibilities gradually.

Backend can take over or augment:

- candidate pool preparation
- shared exposure tracking
- cross-user balancing
- incremental feed window serving
- stronger global novelty/freshness control

Core logic should remain recognizable:

- separate candidate pools
- feed assembly
- quotas
- diversity constraints
- exposure penalties

## v1 implementation summary (frontend-only)

A first implementation should:

- generate source, collection, and item candidates in the client
- apply source-aware balancing rules
- assemble next windows with a target type mix
- avoid local repetition inside and across recent windows
- track recent exposure in browser-local memory
- progressively renew future windows over time

Formula details and scoring weights should be documented separately in a dedicated v1 feed algorithm spec.

## Relationship to existing browse docs

This document complements `docs/architecture/collection-browser-browse-hierarchy-plan.md`.

- browse hierarchy plan defines browse entity semantics and UI-level hierarchy
- this document defines how mixed Browse windows should be orchestrated over time
