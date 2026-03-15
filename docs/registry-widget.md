# Registry Widget

`<open-collections-registry-widget>` is a small embeddable Web Component for registering collection URLs and showing recent additions.

## Quick embed

```html
<script type="module" src="/src/shared/components/open-collections-registry-widget.js"></script>

<open-collections-registry-widget
  submit-url="/api/registry/register"
  recent-url="/api/registry/recent?limit=5">
</open-collections-registry-widget>
```

## Component API

Tag:
- `open-collections-registry-widget`

Attributes:
- `submit-url`: backend endpoint for registration POST
- `recent-url`: backend endpoint for recent registrations GET
- `recent-limit` (optional): number of recent items to render, default `5`, max `20`
- `title` (optional): override heading text
- `intro` (optional): override intro text
- `api-mode="mock"` (optional): run without backend using built-in demo responses
- `demo` (optional): shorthand for mock mode

Properties:
- `submitUrl`
- `recentUrl`
- `recentLimit`

## Backend contract

POST `submit-url` request body:

```json
{
  "url": "https://example.org/collections.json"
}
```

POST response (success):

```json
{
  "ok": true,
  "status": "valid",
  "message": "Collection registered successfully.",
  "item": {
    "id": "abc123",
    "title": "Maps collection",
    "url": "https://example.org/maps/collection.json",
    "type": "collection",
    "addedAt": "2026-03-14T10:00:00Z"
  },
  "warnings": []
}
```

POST response (warning):

```json
{
  "ok": true,
  "status": "warning",
  "message": "Collection registered with warnings.",
  "item": {
    "id": "abc123",
    "title": "Maps collection",
    "url": "https://example.org/maps/collection.json",
    "type": "collection",
    "addedAt": "2026-03-14T10:00:00Z"
  },
  "warnings": [
    "Some optional metadata is missing."
  ]
}
```

POST response (error):

```json
{
  "ok": false,
  "status": "error",
  "message": "Could not validate this URL."
}
```

GET `recent-url` response:

```json
{
  "items": [
    {
      "id": "abc123",
      "title": "Maps collection",
      "url": "https://example.org/maps/collection.json",
      "type": "collection",
      "addedAt": "2026-03-14T10:00:00Z",
      "status": "valid"
    }
  ]
}
```

## Behavior summary

- Loads recent registrations on connect.
- Submits one URL at a time.
- Shows feedback for success, warning, validation error, and network/backend error.
- Refreshes recent list after successful registration.
- Keeps entered URL in the field after submit.
