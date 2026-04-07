# Timemap browser overlay layout diagnosis note

Date: 2026-04-05  
Status: short implementation diagnosis for next refactor pass

## Scope inspected

- `src/apps/timemap-browser/src/components/timemap-browser-shell.js` (current shell template/CSS only).

## Current overlay regions

The shell has one shared absolute overlay rail (`.overlay-region`) and three positioned regions that inherit it:

- `.top-overlay` (top chrome anchor)
- `.detail-overlay` (detail card anchor above timeline rail)
- `.bottom-overlay` (timeline rail anchor)

All three share the same inline inset basis via `.overlay-region` using:

- `inset-inline-start/end: max(safe-area, --timemap-shell-overlay-inline-inset)`

## Current shared inset tokens

Shared inset/offset tokens currently involved:

- `--timemap-shell-overlay-inline-inset`
- `--timemap-shell-overlay-top-offset`
- `--timemap-shell-overlay-bottom-offset`
- `--timemap-shell-overlay-detail-rail-gap`
- `--timemap-shell-safe-{top,right,bottom,left}`
- `--timemap-shell-bottom-inset`
- `--timeline-reserved-space`

## Where alignment diverges from the bottom rail

Bottom rail (`.timeline-shell`) is effectively the baseline: `inline-size: 100%` inside `.bottom-overlay`.

### Top chrome divergence

Top region is anchored to the same overlay inset, but `.top-chrome` constrains itself with:

- `inline-size: min(100%, 44rem)`

So on wider viewports, top chrome no longer spans the same usable width as the bottom rail; it becomes a narrower card aligned to the left edge of the shared inset zone. This is the main visual mismatch behind “top chrome not aligned with bottom rail.”

### Detail card divergence

Detail region is also in the same inset system, but `.detail-shell` constrains width with:

- `inline-size: min(100%, 34rem)` (default)
- `inline-size: min(100%, 44rem)` for `[data-mobile-sheet="true"]`

This means detail width behavior changes by mode and remains card-width on desktop while bottom rail stays full-width. Result: detail appears to use a different inset system even though the parent anchor is shared.

## Rules currently fighting each other

The inconsistency is not from different parent inset anchors; it is from child width rules diverging inside the same anchor:

- Shared anchor intent: `.overlay-region` fixed inline inset system.
- Conflicting child behavior:
  - `.timeline-shell { inline-size: 100%; }`
  - `.top-chrome { inline-size: min(100%, 44rem); }`
  - `.detail-shell { inline-size: min(100%, 34rem); }` (+ mobile-sheet variant to `44rem`)

So the shell mixes “full-bleed within inset rail” and “bounded card” patterns in one overlay stack without a clear breakpoint-owned model.

## Concrete recommendation for next refactor

Use a simple mobile-first default:

1. Keep one shared overlay inset region.
2. Make top/detail/bottom all default to `inline-size: 100%` inside that region.
3. Treat desktop constraints as explicit, isolated overrides (single media query block), not baseline behavior.

Practical implication:

- Default behavior (mobile + narrow embed): all three overlays align by construction.
- Desktop-only card constraints (if desired) should be deferred/isolated to one breakpoint policy, e.g. only detail becomes bounded while top/bottom remain full-width, or all three adopt a coordinated max-width + shared centering rule.

This should make the next refactor finite: first normalize width model, then re-introduce optional desktop variants deliberately.
