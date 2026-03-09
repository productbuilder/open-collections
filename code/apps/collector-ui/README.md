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
- Sources manager dialog with connected sources, refresh/remove actions, and add-source forms
- Source roadmap placeholders for planned integrations
- Manifest export controls in a dialog
- Responsive merged card grid viewport across multiple sources
- Metadata edit sidebar for selected item

## Source model in MVP

Enabled providers:
- GitHub (token-auth/public read, manifest-first import, fallback file browsing)
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
- Workspace state is in-memory and can combine assets from multiple sources at once.
- Source and publish concerns are now separate in state (`sources[]` with placeholder `publishDestination` scaffolding).
