# Collection Browser Image Loading and Rendering Performance

## Scope

This note documents current `collection-browser` behavior for manifest loading, thumbnail loading, grid rendering, and viewer image open performance, with a prioritized optimization plan.

Reference sources tested by product direction:

- `https://raw.githubusercontent.com/productbuilder/htm-data/main/dev/org/collectie-hilversum/collections.json`
- `https://raw.githubusercontent.com/productbuilder/htm-data/main/dev/org/collectie-hilversum/prenten/collection.json`

## Current behavior

### A. Manifest and metadata loading

What the code does now:

- Browser fetches manifests as JSON via `fetch()` and normalizes item metadata into plain objects.
- Media is represented as URLs in metadata (`media.url`, `media.thumbnailUrl`); image bytes are not fetched during JSON normalization.

Relevant files:

- `src/apps/collection-browser/src/app.js`
- `src/apps/collection-browser/src/controllers/manifest-controller.js`
- `src/shared/library-core/src/model.js`

Assessment:

- Metadata-first behavior is present at manifest load level.
- However, embedded initialization eagerly hydrates full collection indexes across configured sources (including loading each collection manifest in a `collections.json` source), which increases startup work before user intent.

### B. Thumbnail loading behavior

What the code does now:

- Card components set thumbnail URLs directly into `<img src="...">` during render/update.
- `open-collections-preview-summary-card` and `oc-card-collections` already use `loading="lazy"` on preview images.
- `oc-card-item` previously did not set lazy/decoding hints; this pass adds:
  - `image.loading = "lazy"`
  - `image.decoding = "async"`
  - `image.fetchPriority = "low"`

Relevant files:

- `src/shared/ui/primitives/oc-card-item.js`
- `src/shared/ui/primitives/preview-summary-card.js`
- `src/shared/ui/primitives/oc-card-collections.js`

Assessment:

- Browser-native lazy loading is partially present.
- No IntersectionObserver-based viewport budgeting is currently used.
- Because many item cards are mounted at once, browser lazy loading alone may still queue too many requests in long feeds.

### C. Rendering strategy

What the code does now:

- Browser creates and appends one DOM cell per entity in the selected mode (`all`, `sources`, `collections`, `items`).
- There is no grid virtualization/windowing.

Relevant files:

- `src/apps/collection-browser/src/components/browser-collection-browser.js`
- `src/apps/collection-browser/src/state/browse-model-builders.js`
- `src/shared/ui/primitives/oc-grid.js`
- `src/apps/collection-browser/src/components/browser-browse-grid.js` (alternate grid component; currently not the primary mounted path)

Assessment:

- Main bottleneck is likely DOM + layout + image pipeline pressure from rendering/mounting all item cards at once.
- This amplifies thumbnail fetch concurrency and decode work.

### D. Viewer / larger image opening

What the code does now:

- Opening an item sets viewer state and immediately sets dialog media `src` to full `media.url` (or fallback thumbnail).
- No next/previous prefetch strategy exists.

Relevant files:

- `src/apps/collection-browser/src/controllers/selection-controller.js`
- `src/apps/collection-browser/src/components/browser-viewer-dialog.js`

Assessment:

- Delay on open is expected when large originals are fetched on demand.
- Without adjacent-item prefetching, each open pays full network + decode latency.

### E. Delivery source performance (`raw.githubusercontent.com`)

Assessment:

- Raw GitHub is acceptable as a baseline for JSON and small thumbnails.
- It is often suboptimal for frequent large image viewing because it is not an image-optimized delivery path (no adaptive transforms, limited edge optimization for image UX, variable latency).
- For smoother viewer opens, prefer static/CDN delivery for media while keeping manifest hosting flexible.

## Likely causes of sluggishness (highest confidence)

1. Eager mounting of all item cards in large result sets (no virtualization/windowing).
2. Thumbnail request/decode pressure from large mounted grids.
3. Embedded source hydration loads broad catalog data early.
4. Viewer fetches full image on demand with no adjacent prefetch.
5. Raw GitHub media delivery latency for larger images.

## Recommended changes (priority order)

1. Keep metadata-first loading strict.
   - Maintain lightweight `collection.json` item summaries.
   - Avoid eager hydration of all source manifests at startup when not needed.

2. Harden thumbnail lazy behavior.
   - Completed first-step in this pass for `oc-card-item` (`loading`, `decoding`, `fetchPriority`).
   - Keep summary/source previews lazy.

3. Add viewport-budgeted thumbnail activation.
   - Add an IntersectionObserver layer that delays assigning `img.src` until card enters a near-viewport threshold.
   - Use root margin prewarm (for example `300-600px`) to avoid visible pop-in.

4. Add grid virtualization/windowing for item-heavy surfaces.
   - Window by rows in `items` mode first (largest win, lowest risk).
   - Keep `sources` and `collections` unvirtualized initially.
   - Preserve keyboard and card activation semantics.

5. Add lightweight viewer prefetch.
   - On viewer open, prefetch immediate neighbors (`index-1`, `index+1`) with low priority.
   - Cancel or limit prefetch when network is constrained.

6. Keep full image fetch tied to user intent.
   - Continue fetching full image only at viewer open.
   - Optionally add a progressive path (`thumbnail -> full`) inside viewer for slow networks.

7. Improve media delivery path.
   - Prefer GitHub Pages/static CDN/object storage for media URLs.
   - Keep `raw.githubusercontent.com` as fallback/dev baseline.

## Small implementation scaffold included in this pass

- `src/shared/ui/primitives/oc-card-item.js`
  - Added native browser lazy/decode/priority hints for thumbnail images.
- `src/apps/collection-browser/src/components/browser-collection-browser.js`
  - Added TODO seam at card append loop for future virtualization/windowing implementation.

## Suggested next implementation sequence

1. Implement item-mode virtualization in `open-browser-collection-browser`.
2. Add IntersectionObserver-based thumbnail source assignment in `oc-card-item`.
3. Add adjacent-image prefetch in `browser-viewer-dialog` / `selection-controller`.
4. Introduce media-host guidance in config/docs for non-raw production delivery.
