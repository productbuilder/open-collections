# Open Collections Connector App

Open Collections Connector is the dedicated connection-management app scaffold.

## Purpose

- Provide a focused surface for adding, inspecting, repairing, and removing connections.
- Reuse the existing account connection UI while migration is in progress.
- Keep startup/runtime behavior aligned with shared account runtime foundations.

## Current phase

This first migration step intentionally keeps scope narrow:

- connector app scaffold and entrypoint are added
- connection UI is reused from existing account components
- account app remains unchanged for compatibility during migration

## Entry

- Source app host page: `/src/apps/collection-connector/`
- Source web component script: `/src/apps/collection-connector/src/index.js`
