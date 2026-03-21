# Shared Bucket Browser App

This app scaffolds a shared bucket/workspace browser layer that can sit underneath domain-specific experiences such as Open Collections and Productbuilder.

## Purpose

The app is intended to become the common browser/workspace shell for:

- bucket-backed asset browsing
- folder and path navigation
- local versus remote visibility states
- focused details and preview flows
- bulk selection and future working-copy actions

## Current scaffold

- App shell with desktop/mobile panel layout
- Workspace toolbar, tree, viewport, details, preview, bulk-action bar, and status bar web components
- Distinct state for active workspace, path, focus, selection, preview, filters, and mobile panel visibility
- Service/adapter boundary through `workspace-service.js`
- Mock in-memory data flow to demonstrate event wiring without hard-coding storage backends

## Future work

- Connect real adapters for Tauri, SQLite, filesystem, IndexedDB/OPFS, or remote bucket APIs
- Add explicit working-copy / check-in / sync workflows
- Add richer preview types, search/filter execution, and persistent workspace selection
- Layer Open Collections and Productbuilder-specific workflows on top of this shared app

## Entry

- Source app host page: `/src/apps/bucket-browser/`
- Source web component script: `/src/apps/bucket-browser/src/index.js`
- Published app host page: `/apps/bucket-browser/`
- Published web component script: `/apps/bucket-browser/src/index.js`
- Top-level custom element: `<pb-workspace-browser>`

