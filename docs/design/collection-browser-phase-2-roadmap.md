# Collection Browser Phase 2 Roadmap

## Purpose
Propose the next phase of work now that the canonical architecture exists.

## 1. Summary
Phase 2 should focus on scaling and hardening the canonical browser architecture introduced in Phase 1, rather than revisiting foundational ownership decisions. The goal is to reduce regression cost, improve performance under higher load, and progressively remove transitional seams as shell-native surfaces mature.

## 2. What Phase 2 is not
Phase 2 should explicitly avoid reopening already-settled foundational work unless there is new evidence that warrants it.

- Not another core refactor of ingestion/store ownership.
- Not a redo of the canonical runtime store architecture.
- Not a return to split list/map ingestion or projection paths.

## 3. Candidate workstreams
The following workstreams are likely Phase 2 candidates. They are options to sequence based on measured pain points and product priorities.

### A) Browser-level interaction test harness
Create an interaction-focused harness that validates canonical list/map behavior, filtering, selection, detail open/close flows, and parity-critical transitions.

### B) List virtualization/windowing
Introduce virtualization/windowing for large list renders to control DOM size, improve scroll performance, and reduce memory pressure.

### C) Map clustering / spatial indexing
Add clustering and/or spatial indexing to sustain map responsiveness as point density grows and interaction complexity increases.

### D) Backend query/index services
Evaluate server-assisted query/index pathways for cases where client-only projection/filtering becomes cost-prohibitive at target collection scales.

### E) Worker / off-main-thread projections
Move heavy projection/filter transforms off the main thread where profiling shows UI contention.

### F) Shell-native surfaces replacing bridge logic
Continue moving behavior into shell-native surfaces so runtime communication depends less on compatibility bridges.

### G) Further bridge removal and package cleanup
Retire bridge/event compatibility seams and remove now-obsolete packages/modules once replacements are stable.

## 4. When each workstream becomes necessary
Use operational signals to trigger each investment:

- **Interaction harness**: necessary when interaction regressions are frequent, expensive, or hard to isolate before merge.
- **Virtualization/windowing**: necessary when list DOM size creates measurable frame drops, long commit times, or poor memory behavior.
- **Clustering/spatial indexing**: necessary when map pan/zoom/select interactions degrade with realistic high-point datasets.
- **Backend query/index services**: necessary when client projection/filter latency exceeds acceptable UX budgets for target scales.
- **Off-main-thread projections**: necessary when profiling attributes jank to projection/filter computation on the UI thread.
- **Shell-native replacement + bridge removal**: necessary when bridge seams remain a primary source of bug classes or slow down feature delivery.

## 5. Recommended priority order
A practical sequencing for the next phase:

1. **Browser-level interaction test harness** (highest leverage for regression prevention).
2. **Shell-native surface continuation + bridge reduction** (reduce long-term maintenance drag).
3. **List virtualization/windowing** (activate when dataset and DOM pressure justify it).
4. **Map clustering/spatial indexing** (activate when map density is a measured bottleneck).
5. **Worker/off-main-thread projections** (targeted after profiling confirms main-thread contention).
6. **Backend query/index services** (larger investment gated by scale/product needs).

This order favors risk reduction and maintainability first, then performance investments based on measured thresholds.

## 6. Decision criteria
Before committing to each workstream, evaluate:

- **Regression cost**: incident frequency, severity, and time-to-diagnosis.
- **User-perceived performance**: frame stability, interaction latency, and time-to-usable-state.
- **Engineering throughput**: whether compatibility seams or missing test coverage are blocking delivery speed.
- **Scale trajectory**: expected near-term collection sizes, point densities, and filter complexity.
- **Operational complexity tradeoff**: added system complexity versus measurable user/developer benefit.

Only proceed when indicators show clear payoff versus implementation and maintenance cost.

## 7. Suggested near-term plan
Recommended next 2–4 engineering steps:

1. Define and implement a minimal browser-level interaction harness covering parity-critical flows (list/map load, filter, selection, detail behavior, source scoping).
2. Identify and prioritize the top remaining bridge seams; schedule targeted shell-native replacements for the highest regression or maintenance impact areas.
3. Add lightweight performance instrumentation (list render cost, map interaction latency, projection time) to establish baselines for virtualization/clustering/worker decisions.
4. Run a short decision checkpoint after instrumentation data is collected to finalize which performance workstream (virtualization, clustering, worker offload, or backend query support) should start first.
