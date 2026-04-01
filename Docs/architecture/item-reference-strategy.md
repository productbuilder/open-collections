# Item Reference Strategy (Manifest Resolver)

## Why This Exists
Presentation-style experiences (for example time-comparer) need to reference items across collections and sources.

We want a simple cross-collection reference model now, without introducing a database or global registry requirement.

## Proposed Item Reference Model
Use an explicit locator object for item references:

```json
{
  "resolver": "manifest",
  "sourceUrl": "https://raw.githubusercontent.com/productbuilder/htm-data/main/dev/org/collectie-hilversum/source.json",
  "collectionUrl": "https://raw.githubusercontent.com/productbuilder/htm-data/main/dev/org/collectie-hilversum/prenten/collection.json",
  "itemId": "270442"
}
```

## Field Semantics
- `resolver: "manifest"`: Explicitly declares the resolution strategy.
- `sourceUrl`: Canonical source/root descriptor context.
- `collectionUrl`: Specific collection manifest containing the item.
- `itemId`: Item identifier within that collection.

## Why Manifest-Based Resolution Is Preferred For Now
- Lightweight and practical for current app needs.
- Works across collections and sources.
- Keeps references explicit and portable.
- Avoids requiring a DB-backed resolver as a prerequisite.

## Benefits
- No DB required.
- Cross-collection capable.
- Explicit, URL-based, portable references.
- Simple mental model for template/app authors.

## Tradeoffs / Limitations
- Resolution depends on manifest URL reachability and stability.
- No global deduplication or ranking layer by default.
- Reference quality depends on stable `itemId` usage within source collections.

## Initial Usage
Expected first use:
- `collection-presenter` time-comparer items (and related presentation templates).

Likely later use:
- Other app templates that need item-to-item linking across collection boundaries.

## Future Considerations
- Keep this as the baseline strategy, then add richer linking/indexing later if needed.
- Preserve compatibility with simple local item references where practical.
- Allow future resolver types while keeping `resolver: "manifest"` backward-compatible.

## Scope Note
This document records the reference strategy decision only.

It does **not** introduce resolver implementation, schema migration, or DB/index infrastructure changes.
