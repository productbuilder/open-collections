# Open Collections Time Comparer App

`time-comparer` is a presentation app/component for before-vs-after image comparisons.

## What it does

- Displays a "past" and "present" image in one frame.
- Uses an interactive before/after slider with:
    - a thin vertical divider
    - a circular knob centered on the divider
- Supports mouse drag, touch drag, click-to-move, and keyboard controls.

## Saved item/config shape

`time-comparer` is represented as a normal manifest item with additional presentation fields:

```json
{
	"id": "presentation-time-comparer-001",
	"type": "presentation",
	"presentationType": "time-comparer",
	"title": "Then and now comparison",
	"compare": {
		"pastItemId": "item-old",
		"presentItemId": "item-new"
	},
	"settings": {
		"initialSplit": 0.5,
		"pastLabel": "Past",
		"presentLabel": "Present",
		"showLabels": true
	},
	"media": {
		"type": "image",
		"url": ""
	},
	"license": ""
}
```

Notes:

- `compare.pastItemId` and `compare.presentItemId` should reference other image items in the same collection.
- `settings.initialSplit` uses a `0..1` value.

## Integration in MVP

- `collection-manager` can create a draft time-comparer item from the current collection.
- `collection-browser` opens and renders `presentationType: "time-comparer"` items in the viewer dialog.
- Viewer wrapper resolves linked collection images first; if links/media are missing it falls back to built-in public demo images so slider behavior can be tested immediately.

## MVP limitations

- No dedicated editor UI yet for selecting/changing linked past/present items.
- No zoom/pan sync, alignment correction, or annotations.
- Demo fallback mode is for testing/development only; real linked collection image references remain the intended production path.
