# maplibre-sky-fog-terrain-baseline-v2

Second-iteration sandbox for the MapLibre sky/fog/terrain baseline.

## Relationship to v1

This sandbox is based directly on the working horizon/camera baseline from `maplibre-sky-fog-terrain-baseline-v1`.

- v1 remains unchanged as the original reference baseline.
- v2 preserves the same default Hilversum-centered camera direction and FOV testing flow.
- v2 focuses on map quality and app-like layout scaffolding around that established camera behavior.

## What changed in v2

- **Vector basemap upgrade**
  - keeps the v1 move from raster into vector, but now aligns style direction with the existing `oc-map` look using `https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json`
  - removes the temporary alternative styling direction that made local roads/labels feel less like the current Open Collections browsing map
  - keeps sky/fog/terrain camera experimentation on top of the familiar map foundation so local readability stays the first priority

- **Stronger atmospheric fog**
  - sky/fog settings remain in the same soft blue + white direction
  - fog blend values are increased so terrain fades more strongly into the horizon band

- **Bottom white shelf scaffold**
  - reduces shelf height so it reads as a compact floating panel instead of a dock
  - detaches shelf from screen edges with left/right/bottom margins + subtle elevation
  - adds a first simple horizontal slider as a timeline placeholder (no timeline logic yet)

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
- keep the familiar `oc-map` basemap character first (readable local streets + labels)
- strengthen atmospheric depth via fog
- establish app-shell-like top/center/right/bottom composition
