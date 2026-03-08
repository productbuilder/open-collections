# Collector UI (Web Component MVP)

TimeMap Collector UI is exposed as a Web Component:

`timemap-collector`

## Embedding

```html
<script type="module" src="/code/apps/collector-ui/src/index.js"></script>
<timemap-collector></timemap-collector>
```

## Features

- Shadow DOM component shell with encapsulated styles
- White SaaS-style header with toolbar actions
- Provider dialog with provider cards and connection state
- Provider roadmap placeholders for planned storage integrations
- Manifest export controls in a dialog
- Responsive card grid viewport
- Metadata edit sidebar for selected item

## Provider model in MVP

Enabled providers:
- GitHub (token-auth, read/import, manifest export)
- Public URL (read-only)
- Example dataset (local editable)

Planned placeholders:
- Google Drive
- S3-compatible storage
- Wikimedia Commons
- Internet Archive

## Notes

- Built as ES modules with no build step.
- Intended for local static hosting from repository root.
- GitHub flow uses Personal Access Token config fields (owner/repo/branch/path).
