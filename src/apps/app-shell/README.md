# Open Collections App Shell

`app-shell` is a shared shell container for Open Collections sub-apps.

## Purpose

The shell centralizes:

- global navigation
- the main app viewport/content region

This is scaffolding only. It does not yet mount the real app implementations.

## Current placeholder sections

- **Browse** → placeholder for `collection-browser`
- **Collect** → placeholder for `collection-manager`
- **Present** → placeholder for future `collection-presenter`
- **Account** → placeholder for the future account area

## Next step

Replace each section placeholder renderer with a mounted sub-app boundary, keeping the shell navigation and responsive layout owned by this app.
