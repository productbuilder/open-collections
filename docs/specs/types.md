# Open Collections – Item Types

## Purpose

The `type` field provides a simple, consistent way to classify items by place category across Open Collections.

It is used for filtering in timemap-browser and collection-browser, and should produce deterministic results regardless of collection source.

## Core principle

`type` describes the real-world entity or place represented by an item.

It is a physical or spatial classification, not a thematic one. This aligns with a place register (gazetteer) approach, similar to systems such as Gent Gemapt, where entries are categorized by what kind of place they are.

## Current scope (v1)

Version 1 supports only place-based items.

## Allowed types (v1)

### `building`
A constructed structure intended for human use or occupation.

Examples:
- City hall
- Church
- School
- Warehouse

### `street`
A named road segment used for movement through an urban or rural area.

Examples:
- Main Street
- Market Lane
- Ring Road

### `square`
A named public open space in a built environment, typically used as a civic or social node.

Examples:
- Town square
- Market square
- Cathedral plaza

### `park`
A managed public green space intended for recreation, gathering, or leisure.

Examples:
- Central Park
- Neighborhood playground park
- Botanical park

### `nature`
A natural landscape area not primarily defined as urban infrastructure.

Examples:
- Forest
- Heathland
- Dune area

### `water`
A water body or watercourse used as a geographic reference.

Examples:
- River
- Canal
- Lake
- Harbor basin

### `transport`
A transport-related place or infrastructure node used for mobility.

Examples:
- Train station
- Tram stop
- Bridge
- Tunnel

### `site`
A bounded or known location of significance that does not fit the other place categories.

Examples:
- Archaeological site
- Industrial site
- Historic grounds

## Non-goals

`type` must **not** be used for:
- Themes (for example: media, historic, urban)
- Descriptive labels

These belong in `tags`.

## Relationship to tags

- `type` = single primary classification
- `tags` = multiple secondary descriptors

Example:

```json
{
  "id": "item-001",
  "title": "Old Harbor Bridge",
  "type": "transport",
  "tags": ["historic", "steel", "waterfront"]
}
```

## Data requirements for map usage

For map-based usage, items must include:
- `location.lat`
- `location.lon`

`type` is recommended so items can participate in type-based filtering. If `type` is missing, items can still render on map/timeline views when valid coordinates are present.

## Filtering behavior

- Filter options are derived from the types present in the currently loaded item set.
- Filtering logic is implemented in timemap-browser.
- browse-shell is responsible only for UI handling.

## Future extensions

Planned type families may include:
- `person`
- `organization`
- `event`
- `document`

These are explicitly **not** part of v1.
