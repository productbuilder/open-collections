# Feed Algorithm v1

## Purpose

Feed Algorithm v1 is the first practical orchestration model for generating the Browse stream.

It is designed to:

- run fully in the frontend in the current implementation context
- operate within browser constraints
- prevent item over-dominance
- balance visibility across sources
- produce a readable rhythm across source, collection, and item cards
- support renewal over repeated visits
- remain conceptually compatible with future backend orchestration

This spec complements `docs/architecture/collection-browser-browse-stream-orchestration.md`.

## Scope and assumptions

Current reality:

- implementation is frontend-only
- no shared backend orchestration is required for v1
- no database is assumed for v1

Implication:

- all candidate generation, scoring, and feed window assembly run in the browser
- exposure memory is local and per browser/user device

## v1 model overview

Feed Algorithm v1 has five core parts:

1. Build separate candidate pools by type.
2. Compute transparent, lightweight candidate scores.
3. Define target per-type counts for the next window.
4. Assemble a mixed window with diversity/pacing constraints.
5. Record shown cards in local exposure memory.

## Candidate pools

### Source candidate pool

Contains source-card candidates.

Why separate:

- source cards provide orientation and identity
- source exposure must be controlled independently of item volume

### Collection candidate pool

Contains collection-card candidates.

Why separate:

- collections are mid-level entry points into related items
- they should not compete directly with raw item abundance

### Item candidate pool

Contains item-card candidates.

Why separate:

- items are numerically dominant and would overwhelm a flat ranking
- separate handling allows controlled abundance without domination

## Why separate pools instead of one flat list

A flat list tends to collapse into item-heavy ranking and source concentration.

Separate pools allow:

- explicit type quotas
- source-aware balancing per type
- clearer pacing and local diversity constraints
- stable mixed-feed behavior even as corpus composition changes

## Feed window model

v1 assembles feed in windows, not one infinite pre-ranked list.

Recommended initial window size:

- 20 cards per window

Why windows:

- local balancing is easier to enforce
- local diversity constraints are easier to validate
- incremental loading is straightforward
- renewal can be applied between windows
- feasible for frontend-only execution

## Target card-type mix

Starting target ratios per window:

- 15-20% source cards
- 35-40% collection cards
- 40-50% item cards

Concrete baseline for a 20-card window:

- 3 source cards
- 7 collection cards
- 10 item cards

These are starting defaults for tuning, not fixed product truth.

## Candidate scoring dimensions (v1)

Use a transparent weighted score per candidate. No ML model is required.

Suggested dimensions:

- freshness: newer or recently updated entities get a boost
- novelty: entities not seen recently get a boost
- editorial/preview quality: higher quality preview surfaces get a boost
- diversity contribution: candidates that improve source/type spread get a boost
- source underexposure boost: underrepresented sources get positive adjustment
- repetition penalty: repeated entity/collection appearances get penalized
- source overexposure penalty: recently frequent sources get penalized

Notes:

- keep dimensions inspectable and debuggable
- keep weights configurable and easy to tune in frontend code

## Source balancing rules (first-class)

v1 must enforce source balancing explicitly.

Rules:

- source size affects availability, not direct entitlement
- large sources must not dominate due to raw count alone
- smaller sources should receive protected minimum visibility over time
- recent source appearances should reduce near-term probability of another card from the same source

This applies across all card types, not just source cards.

## Local diversity and pacing constraints

During window assembly, apply hard or near-hard constraints:

- do not place two source cards back-to-back
- avoid more than two cards from the same source in a short local span (for example 6-8 cards)
- avoid immediate repetition of the same collection
- prefer spacing source cards across the window
- use item cards to fill rhythm gaps between larger-context cards (source/collection)

These constraints are part of feed quality, not optional polish.

## Repetition and exposure handling (frontend-only v1)

Track exposure locally in browser state.

Exposure layers:

- seen this session
- seen recently (persisted short horizon)
- seen less recently (persisted longer horizon)

Storage approach:

- in-memory session structures for immediate constraints
- localStorage (or equivalent browser storage) for short/medium history

Usage:

- penalize recently shown entities
- penalize recently shown sources
- avoid near-duplicate windows over consecutive loads

Limitations (accepted for v1):

- per-browser/per-device only
- not globally coordinated
- approximate fairness/novelty

## Frontend-only v1 execution flow

Recommended execution flow:

1. Load available source/collection/item manifests in the client.
2. Build source, collection, and item candidate pools client-side.
3. Compute candidate scores with lightweight weighted logic.
4. Determine target counts per type for the next 20-card window.
5. Assemble mixed window while enforcing pacing/diversity/source constraints.
6. Render window and record exposure in local memory/storage.
7. On next window request, repeat with updated exposure state.

Why viable now:

- implementation fits current frontend-only architecture
- enough to validate balancing, rhythm, and renewal behavior

Known limits:

- limited global fairness
- weaker long-horizon freshness control
- scale constraints compared to backend precomputation

## Backend migration path (later)

Keep conceptual structure stable; migrate execution responsibilities gradually.

Likely backend responsibilities later:

- candidate pool precomputation
- shared exposure tracking across users/sessions
- stronger global freshness and novelty balancing
- stronger long-horizon source fairness controls
- incremental feed window serving APIs
- scalable ranking/rule evaluation

Conceptual model should remain unchanged:

- separate pools
- scoring
- quotas
- constraints
- window assembly

## Pseudocode-level assembly outline

```text
function buildNextWindow(state):
  pools = {
    source: buildSourceCandidates(state),
    collection: buildCollectionCandidates(state),
    item: buildItemCandidates(state),
  }

  scored = {
    source: scoreCandidates(pools.source, state.exposure),
    collection: scoreCandidates(pools.collection, state.exposure),
    item: scoreCandidates(pools.item, state.exposure),
  }

  targets = computeTypeTargets(windowSize=20, mix={source:3, collection:7, item:10})

  window = []
  while window.size < 20:
    nextType = chooseNextType(window, targets, pacingRules)
    candidate = pickBestAllowed(scored[nextType], window, constraints, state.exposure)

    if candidate is null:
      candidate = fallbackPick(scored, window, constraints)

    append(window, candidate)
    markTempExposure(state, candidate)

  persistExposure(window, state)
  return window
```

## Non-goals for v1

Feed Algorithm v1 does not attempt to deliver:

- a personalized recommendation engine
- globally shared cross-user feed state
- required backend orchestration
- heavy optimization for very large corpus sizes
- ML-based ranking

v1 is intentionally transparent, controllable, and implementation-ready for frontend prototyping.

## Implementation checklist

Before implementation starts, confirm:

- window size and default type mix values
- minimal candidate fields needed per type
- local exposure schema (session + persisted)
- initial weights and constraints configuration
- observable debug output for score/constraint decisions

This keeps v1 practical and testable during the first build pass.
