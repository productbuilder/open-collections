# Apps, Shells, Hosts Architecture

## Purpose

Define a clear frontend ownership model based on **apps**, **shells**, **hosts**, and a deliberately small **shared** layer.

This document is intended to guide practical refactoring and new code placement decisions so code is organized by ownership, not by vague buckets (for example, `runtime`).

## Definitions

### Apps

Apps are standalone frontend feature surfaces.

Apps:

- own feature UI
- own feature logic
- own app-specific state and services
- can run standalone
- can also be mounted inside shells

### Shells

Shells are composition surfaces.

Shells:

- are always web components
- orchestrate one or more apps
- own shell layout, navigation, and embedding/composition logic
- do not own feature business logic

### Hosts

Hosts are platform-specific entry targets.

Hosts:

- bootstrap runtime for a platform
- mount a shell or app
- own platform-specific setup and integrations
- do not own feature business logic

Examples:

- `pwa-host`
- `mobile-host`
- `desktop-host`

### Shared

Shared is intentionally small.

Shared should only contain genuinely cross-cutting code, such as:

- contracts
- shared UI primitives
- utilities

Shared should **not** become a dumping ground for code that really belongs to an app, shell, or host.

## Target Structure

```text
src/
  apps/
  shells/
  hosts/
  shared/
    contracts/
    ui/
    utils/
```

### Structure Notes

- Platform-specific shells should be treated as **hosts**.
- The same app should be runnable standalone and when embedded via shell/host composition.
- `shared/` should contain stable seams and primitives, not ownership-ambiguous logic.

## Dependency Direction

Use the following dependency rule as the default:

```text
host -> shell -> app
host -> shared
shell -> shared
app -> shared

app -/-> host
app -/-> platform-specific code
```

Interpretation:

- Hosts depend downward on shells/apps/shared to assemble platform entry points.
- Shells depend on apps/shared to compose experiences.
- Apps may depend on shared contracts/primitives/utilities, but not on hosts.
- Platform details remain outside app feature boundaries.

## Ownership Rules

1. **Ownership-first rule**  
   Code lives with the thing that owns its behavior.

2. **Apps stay host-agnostic**  
   Apps do not directly depend on PWA/mobile/desktop specifics.

3. **Shells focus on composition**  
   Shells handle layout, navigation, embedding, and orchestration.

4. **Hosts focus on platform concerns**  
   Hosts handle installability, service worker setup, native bridges, and platform bootstrap.

5. **Shared remains minimal**  
   Shared contains only cross-cutting contracts, UI primitives, and utilities.

6. **Prefer explicit names**  
   Avoid vague buckets (especially `runtime`) unless tightly scoped and clearly named.

## Naming Guidance

Favor explicit, behavior-oriented names over generic containers.

Preferred examples:

- `contracts`
- `bootstrap`
- `composition`
- `capabilities`
- `embedding`
- `session`
- `navigation`

Guideline:

- If a directory name does not communicate ownership and behavior, rename/split it.
- Reuse is secondary to ownership clarity; colocate code with the owner first.

## Interpreting the Current Repository

Current structure appears to be moving in this direction, with some transitional areas:

- Feature apps exist under `src/apps/`.
- `app-shell` is conceptually a shell/composition surface rather than a feature app.
- Desktop and mobile workbenches are conceptually hosts.
- Some modules currently under `src/shared` may be better moved to explicit app/shell/host owners over time.

This interpretation is a pragmatic working model for incremental migration, not a claim that all current boundaries are already final.

## Migration Direction

Use incremental migration and avoid big-bang reorganization.

Practical steps:

1. Classify moved/changed code by owner first: app, shell, host, or shared.
2. Move composition logic out of apps into shells where boundaries are mixed.
3. Move platform-specific code out of apps/shells into hosts.
4. Shrink `shared/` by relocating ownership-specific modules.
5. Keep only stable contracts/primitives/utilities in shared.
6. Introduce explicit names when splitting broad folders (for example replacing broad `runtime` buckets with bounded modules).

## Concise Examples

### Example A: Navigation behavior

- Shell-owned: top-level app switching, chrome navigation state, embedded app routing integration.
- App-owned: feature-level routes and view state internal to that app.

### Example B: Platform integration

- Host-owned: service worker registration, install prompts, native bridge initialization.
- Not app-owned: direct platform bridge calls inside feature modules.

### Example C: Shared contract

- Shared-owned: typed interface for app-to-shell events.
- Shell/app-owned implementations: concrete event producers/consumers that apply the contract.

## Decision Checklist

Before adding or moving code, ask:

1. Who owns this behavior?
2. Is this platform-specific?
3. Is this composition logic?
4. Is this truly cross-cutting and stable?

If ownership is unclear, resolve ownership first and place code accordingly.
