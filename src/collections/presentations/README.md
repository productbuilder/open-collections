# Presentations collection

Sample collection used by the **Present** (`collection-presenter`) MVP surface.

## Item model used in MVP

Presentation items follow the existing repository pattern already used by `time-comparer`:

- `type: "presentation"`
- `presentationType: "time-comparer"`
- `compare` for linked item references (`pastItemId`, `presentItemId`)
- `settings` for template-specific options (`initialSplit`, labels, etc.)

See `collection.json` for the first example item (`presentation-time-comparer-001`).
