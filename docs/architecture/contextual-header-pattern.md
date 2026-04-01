# Contextual Header Pattern for Root and Nested Views

## Why this decision is needed

Across the app-shell family, headers have drifted toward mixed patterns where root entry headers and nested contextual headers can appear together. This creates competing visual hierarchy and makes it less clear whether the user is looking at a section-level landing state or a drilled-in context.

This decision standardizes header behavior before additional UI refactor work continues, so new implementation follows one predictable model.

## Root header pattern (entry view)

A root section view should show:

- section title
- section subtitle

Examples of root section framing:

- Connect and share
- Browse and collect
- Manage and curate
- Create and Present
- Account and settings

This header answers:

- **Where am I in the product?**

## Contextual/nested header pattern (drilled-in view)

When a user drills into a deeper state, the root entry header should be replaced by a contextual header that shows:

- back button
- contextual title
- contextual subtitle or status text

Examples:

- Example collections / 4 collections in this source
- Example Dataset / 2 items
- Add connection
- Profile

This header answers:

- **What am I looking at right now?**

## Core hierarchy principle

Only one header should be visually primary at a time.

Avoid stacking the root entry header and a second contextual header in the same screen unless there is a very strong, explicit reason.

## Why this pattern is preferred

- Clarifies visual hierarchy by making state depth obvious.
- Reduces duplicate competing headings.
- Aligns with the Browse-style contextual replacement pattern that already tests well as a navigation model.
- Keeps section identity for entry states while allowing precise, task-oriented framing for nested states.
- Supports incremental migration without removing shared header capabilities.

## Shared header capability remains in scope

This decision is **not** about reducing the shared header system. The shared header system should continue to support:

- back button / leading slot
- status pills
- small actions
- contextual status text

The change is about **consistent hierarchy and replacement behavior**, not capability removal.

## Implications for current apps

- **Connect**: Root connection landing states use section title/subtitle; connection-specific flows replace with contextual headers.
- **Browse**: Continue using contextual replacement as the reference behavior for drill-in views.
- **Collect**: Collection-management root screens keep section framing; item-, source-, and workflow-level states switch to contextual headers.
- **Present**: Presentation roots keep entry framing; editor/setup/detail states use contextual headers.
- **Account**: Account root keeps section framing; profile/security/preferences details switch to contextual headers.

## Migration note

Adopt incrementally during ongoing app-shell family UI updates:

- apply this rule to all new or touched screens first
- avoid big-bang rewrites
- remove double-header states opportunistically as related screens are updated

## Open questions / later polish

- Should we define explicit spacing/typography tokens for root vs contextual header density?
- Do we need a shared state contract for contextual subtitle/status text (for example item counts, source state, sync state)?
- Should small actions be constrained by breakpoint or view depth to avoid crowding contextual headers?
- Should we add visual examples (wireframes/screenshots) in a follow-up doc once migration begins?
