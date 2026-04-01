# Presentation Item And ItemRef Model

## Why This Decision Is Needed
The current presentation item shape is too template-specific (`presentationType`, `compare.pastItemId`, `compare.presentItemId`) and does not scale well to future app templates or cross-collection linking.

This doc records the intended target model before runtime/schema migration work.

## Proposed Presentation Item Model
Presentation items stay inside a generic envelope and become app-driven.

- `type: "presentation"` remains the generic item type.
- `appId` identifies the presentation app/template to render.
- `settings` stores app-specific configuration.
- `media` can still provide card/preview thumbnails.

### Example Item
```json
{
  "id": "b0084a25-1859-4373-a485-932eca7cf71d",
  "type": "presentation",
  "appId": "time-comparer",
  "title": "Comparison",
  "description": "Kampstraat toen en nu",
  "license": "CC-BY-4.0",
  "tags": ["presentation", "time-comparer"],
  "settings": {
    "initialSplit": 0.5,
    "showLabels": true,
    "imageLeft": {
      "label": "1969",
      "itemRef": {
        "resolver": "manifest",
        "sourceUrl": "https://raw.githubusercontent.com/productbuilder/htm-data/main/dev/org/collectie-hilversum/source.json",
        "collectionUrl": "https://raw.githubusercontent.com/productbuilder/htm-data/main/dev/org/collectie-hilversum/prenten/collection.json",
        "itemId": "270442"
      }
    },
    "imageRight": {
      "label": "2021",
      "itemRef": {
        "resolver": "manifest",
        "sourceUrl": "../source.json",
        "collectionUrl": "./collection.json",
        "itemId": "c382975a-187c-4510-976c-2dc67be2a99e"
      }
    }
  },
  "media": {
    "type": "image",
    "url": "https://picsum.photos/id/1040/1200/800",
    "thumbnailUrl": "https://picsum.photos/id/1040/800/530"
  }
}
```

## Generic `itemRef` Model
Use one reusable locator structure across app types:

- `resolver`
- `sourceUrl`
- `collectionUrl`
- `itemId`

`itemRef` is not time-comparer specific. It is a shared reference contract for presentation-style app settings.

## Why Manifest-Based Refs Are Preferred For Now
For now, resolution should be manifest-based and DB-free:

- read source + collection manifests
- resolve the item by `itemId`
- avoid requiring a global item registry/database

Naming direction:

- root source manifest: `source.json`
- leaf collection manifests: `collection.json`

## Benefits
- Cleaner and more app-oriented model.
- Extensible across future presentation apps (`appId` + `settings`).
- Cross-collection capable item references.
- Explicit and portable references.
- No DB requirement for baseline resolution.

## Tradeoffs / Limitations
- Depends on URL reachability and manifest stability.
- No global indexing/ranking guarantees in the baseline strategy.
- `itemId` stability remains important inside source collections.

## Initial Usage
First expected usage:

- `collection-presenter` / `time-comparer`

## Future Considerations
- Add richer linking/indexing later if needed, while keeping `resolver: "manifest"` compatible.
- Plan a migration path from older compare-specific fields to `appId` + `settings` + `itemRef`.
- Keep backward compatibility with simpler local item-id references where practical during migration.

## Scope Note
This is a documentation decision record only.

No runtime implementation, resolver implementation, or schema migration is included in this pass.
