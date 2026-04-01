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
	"appId": "time-comparer",
	"title": "Then and now comparison",
	"settings": {
		"initialSplit": 0.5,
		"imageLeft": {
			"label": "Past",
			"itemRef": {
				"resolver": "manifest",
				"sourceUrl": "../source.json",
				"collectionUrl": "./collection.json",
				"itemId": "item-old"
			}
		},
		"imageRight": {
			"label": "Present",
			"itemRef": {
				"resolver": "manifest",
				"sourceUrl": "../source.json",
				"collectionUrl": "./collection.json",
				"itemId": "item-new"
			}
		},
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

- `settings.imageLeft.itemRef` and `settings.imageRight.itemRef` use manifest-based resolution (`resolver`, `sourceUrl`, `collectionUrl`, `itemId`).
- `settings.initialSplit` uses a `0..1` value.

## Integration in MVP

- `collection-manager` can create a draft time-comparer item from the current collection.
- `collection-browser` opens and renders `appId: "time-comparer"` items in the viewer dialog.
- Viewer wrapper resolves linked collection images first.
- If links/media are missing, renderer falls back to a demo set so slider behavior can be tested immediately.
- Current demo fallback is technical/demo-only behavior and is not intended as production content.
- Demo structure now separates:
    - a preferred heritage-themed demo set (current default demo experience)
    - a generic external fallback demo set (last-resort technical fallback)
- A TODO-ready resolver is in place so a curated heritage demo pair can replace current temporary demo URLs without changing component logic.

## MVP limitations

- No dedicated editor UI yet for selecting/changing linked past/present items.
- No zoom/pan sync, alignment correction, or annotations.
- Demo fallback mode is for testing/development only.
- Intended production use remains real collection-linked heritage imagery.
- Curated heritage demo imagery should replace temporary generic/demo sources when available.
