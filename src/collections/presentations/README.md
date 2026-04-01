# Presentations collection

Sample collection used by the **Present** (`collection-presenter`) MVP surface.

## Item model used in MVP

Presentation items follow the existing repository pattern already used by `time-comparer`:

- `type: "presentation"`
- `appId: "time-comparer"`
- `settings` for template-specific options (`initialSplit`, labels, etc.)
- `settings.imageLeft.itemRef` and `settings.imageRight.itemRef` for manifest-based linked item references

See `collection.json` for the first example item (`presentation-time-comparer-001`).
