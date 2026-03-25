# Collection Manager CSS architecture

This app uses a layered CSS system to keep styles stable and maintainable:

1. **Raw tokens (`tokens.css.js`)**
   - Base design values (color scale, spacing, radii, border widths, shadows).
   - These are low-level and should not usually be referenced directly from feature styles.

2. **Semantic theme tokens (`theme.css.js`)**
   - Intent-based variables such as `--oc-bg-panel`, `--oc-text-muted`, and `--oc-border-subtle`.
   - Feature styles should prefer these semantic tokens.

3. **Primitives (`primitives.css.js`)**
   - Shared class recipes (buttons, pills, panel/dialog headers, empty states, icon buttons).
   - Reuse these instead of re-implementing common visuals.

4. **Component-local CSS (`*.css.js`)**
   - Structure/layout and truly component-specific states.
   - Keep unique one-off values local only when they represent a special state (for example warn/success/destructive tones, media/code surfaces, overlays, or micro-layout adjustments).

## Contributor expectation

When updating Collection Manager styles, avoid introducing raw palette values in component CSS when an existing semantic token or primitive applies.

## Lightweight token guardrail

Use `pnpm --filter @open-collections/manager-app run check:css-tokens` (or run inside the app package) to check for newly introduced raw theme-like values in Collection Manager style changes.

For occasional auditing, run `pnpm --filter @open-collections/manager-app run check:css-tokens:all` (or `node ./scripts/check-css-tokens.mjs --all`) to scan all targeted Collection Manager CSS/component sources.

This check is intentionally lightweight and regex-based. It focuses on obvious drift such as new hex colors and raw border-radius primitives (`4px`, `6px`, `8px`, `10px`, `12px`, `999px`) added in component CSS, and reports file/line/value with guidance to use `--oc-*` tokens or shared primitives.

It intentionally allows known local exceptions (for example overlays, media/code/dark surfaces, and some status/accent states) so component-specific visuals can remain local when justified, and intentionally stays conservative (no broad rgb/rgba/hsl matching) to keep false positives low.
