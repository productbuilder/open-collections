# card-stack-carousel-v4

Sandbox v4 prototypes a **map-first time + space + cards/info explorer**.

## Layout concept

- Top: floating card stack (`oc-card-carousel`) over the map.
- Middle: open map focus area kept clear for interaction/context.
- Bottom: floating timeline above floating search, both safe-area aware.

## State and event flow

- Root wrapper component: `oc-card-stack-map-explorer`.
- Data/state is local/static for now:
  - `query`
  - `timeRange`
  - `mapBounds`
  - `activeCardId`
  - `activeLocation`
  - `activeTime`
  - `visibleCardIds`
- Events:
  - `oc-search-bar` emits `oc-search-query-change`.
  - `oc-timeline-bar` emits `oc-timeline-range-change`.
  - `oc-card-carousel` emits `oc-card-carousel-active-index-change`.

## Reuse

- Reuses shared `oc-map` primitive.
- Reuses shared `oc-time-range-slider` inside local timeline bar.
- Keeps carousel motion engine local copy from v4-3 with minimal fixes only.

## Static demo vs future integration

- Demo records are static Hilversum-area samples in `map-card-explorer.js`.
- Filtering is simple text + year range.
- TODO: wire active card -> map marker/focus/highlight once map marker API wiring is available.

## Manual test steps

1. Open `src/apps/sandbox/card-stack-carousel-v4/index.html` in sandbox runner.
2. Confirm map fills viewport and stays visible behind overlays.
3. Confirm cards float at top and middle area remains open.
4. Confirm timeline floats above search at bottom.
5. Confirm bottom controls respect mobile safe area.
6. Type in search and confirm cards filter.
7. Change timeline range and confirm cards filter.
8. Scroll/swipe card stack and confirm snap behavior remains usable.
9. Confirm map remains interactive in middle open area.
10. Confirm no mobile viewport console errors.
11. Confirm `card-stack-carousel-v4-3` remains unchanged/working.
