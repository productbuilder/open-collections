# maplibre-sky-fog-terrain-baseline-v2

Second-iteration sandbox for the MapLibre sky/fog/terrain baseline.

## Relationship to v1

This sandbox is based directly on the working horizon/camera baseline from `maplibre-sky-fog-terrain-baseline-v1`.

- v1 remains unchanged as the original reference baseline.
- v2 preserves the same default Hilversum-centered camera direction and FOV testing flow.
- v2 focuses on map quality and app-like layout scaffolding around that established camera behavior.

## What changed in v2

- **Vector basemap upgrade**
  - switches from the v1 OSM raster base source to a MapLibre-compatible vector basemap style (`https://demotiles.maplibre.org/style.json`)
  - keeps terrain + hillshade + sky/fog layering so horizon testing remains comparable
  - improves sharpness and label readability under pitched/fov-expanded views

- **Stronger atmospheric fog**
  - sky/fog settings remain in the same soft blue + white direction
  - fog blend values are increased so terrain fades more strongly into the horizon band

- **Bottom white shelf scaffold**
  - introduces a fixed white bottom panel with rounded top corners
  - reserves visual space for future timeline/card UI (placeholder only)
  - no timeline logic and no cards yet

- **Navigation control repositioning**
  - keeps map navigation controls on the right side
  - moves them above the bottom white shelf for mobile-friendly access and non-overlap with the reserved bottom area

## Still intentionally excluded

v2 still does **not** add:

- timeline behavior
- card rendering
- Three.js integration
- story UI

## Purpose of this iteration

v2 is meant to be a cleaner visual + layout foundation before interaction layers are added:

- preserve camera/horizon feel from v1
- improve rendering clarity via vector basemap
- strengthen atmospheric depth via fog
- establish app-shell-like top/center/right/bottom composition
