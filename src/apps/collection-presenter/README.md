# Open Collections Presenter App

Open Collections Presenter is the dedicated **Present** app that will be mounted inside `app-shell`.

## Purpose

- Provide a focused presentation-area app without shell-owned navigation chrome.
- Host presenter-specific workflows in a clean, shell-compatible content surface.
- Start with a clear scaffold for future presenter capabilities.

## Current placeholder status

The first iteration is intentionally a scaffold. It includes presenter-oriented placeholder sections for:

- presentation mode
- display mode
- curated collection presentation
- screen/device presentation settings
- public exhibit/storytelling flows

Each section is marked as scaffold-only so future modules can replace these placeholders incrementally.

## Product model reference

- See `/docs/architecture/present-app-model.md` for the intended Present product and UX model (grid-based presentation items, template picker, configuration flow, and viewer behavior).

## Relationship to `app-shell`

This app is designed to be mounted as the **Present** section inside `app-shell`.

- `app-shell` is expected to own top-level navigation/chrome.
- `collection-presenter` keeps its outer layout minimal and content-focused.
- The app uses shared foundation primitives to stay visually aligned with shell sections.

## Likely future presenter responsibilities

- scene and layout composition for public-facing collection experiences
- display and playback controls for kiosk/screen contexts
- curated storytelling flows and exhibit-ready publishing surfaces
- presentation-specific settings and output modes

## Entry

- Source app host page: `/src/apps/collection-presenter/`
- Source web component script: `/src/apps/collection-presenter/src/index.js`
