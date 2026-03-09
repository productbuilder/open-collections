# TimeMap Collector -- Improvement Plan

This document outlines the improvements needed to evolve the TimeMap
Collector from an MVP prototype into a robust media collection
management tool for heritage and open collections.

------------------------------------------------------------------------

# 1. Asset Viewing (High Priority UX)

Currently cards only show thumbnails and cannot be opened in a larger
viewer.

## Goals

Allow users to inspect assets before editing metadata or including them
in collections.

## Features

-   Click card → select asset
-   Double click / open button → open viewer
-   Viewer shows:
    -   Large image
    -   Title
    -   Description
    -   Metadata
    -   Source
    -   License

## Navigation

-   Previous / Next asset
-   Escape key to close viewer
-   Back to grid button

------------------------------------------------------------------------

# 2. Responsive Application Layout

The Collector should always match the browser window size.

## Desired Layout

Header stays fixed while workspace fills remaining space.

    +---------------------------------------------+
    | Header                                      |
    +----------------------+----------------------+
    | Collection viewport  | Metadata editor      |
    | (scrollable)         | (scrollable)         |
    |                      |                      |
    | grid of cards        | form fields          |
    |                      |                      |
    +----------------------+----------------------+

## Required behavior

Root container:

    height: 100vh
    display: flex
    flex-direction: column

Main workspace:

    flex: 1
    display: flex
    overflow: hidden

Collection viewport:

    flex: 2
    overflow-y: auto

Metadata editor:

    flex: 1
    overflow-y: auto

------------------------------------------------------------------------

# 3. Asset Grid Improvements

Improve browsing experience.

## Improvements

### Click behavior

-   Click card → select asset
-   Double click → open viewer

### Card content

Each card should show:

-   thumbnail
-   title
-   source badge
-   license badge
-   include toggle

### Card indicators

Examples:

    Source: GitHub
    License: CC-BY
    Metadata: incomplete

------------------------------------------------------------------------

# 4. Metadata Editor Improvements

The metadata editor should become easier to use for curators.

## Add

### Scrollable panel

Metadata editor must scroll independently.

### Sticky header

    Metadata editor
    [Save metadata]

### Field grouping

Example groups:

Basic - title - description

Authorship - creator - attribution

Context - date - location

Rights - license - source

Classification - tags

------------------------------------------------------------------------

# 5. Source Management Improvements

Collector should support multiple readable sources.

## Sources dialog

Sections:

### Connected sources

Example:

    GitHub: timemap-data
    Public URL: harbor archive
    Example dataset

### Per-source actions

-   refresh
-   remove
-   inspect

### Source badges

Cards should display source badges.

Example:

    GitHub
    Public URL

------------------------------------------------------------------------

# 6. Collection Workspace Model

Collector should support a workspace combining multiple sources.

Example model:

    Workspace
      sources[]
      assets[]
      filters
      collection manifest

Flow:

    multiple sources
    ↓
    merged asset pool
    ↓
    curated output collection

This enables cross-archive curation.

------------------------------------------------------------------------

# 7. Manifest Editing Improvements

Improve the process of building collection manifests.

## Features

Manifest preview

Export options: - Download manifest - Publish to destination - Copy JSON

Validation warnings:

    missing title
    missing license
    missing media

------------------------------------------------------------------------

# 8. Performance Improvements

As collections grow larger the UI must remain fast.

## Improvements

### Lazy loading

Render only visible cards.

### Thumbnail optimization

Use thumbnail URLs when available.

### Asset indexing

Normalize asset data internally.

------------------------------------------------------------------------

# 9. UX Enhancements

### Keyboard navigation

    Arrow keys → next / previous asset
    Enter → open viewer
    Esc → close viewer

### Search

    filter by title
    filter by tag

### Filter chips

Examples:

    Source
    License
    Date
    Include

------------------------------------------------------------------------

# 10. Status and Error Visibility

Users should clearly see system status.

Examples:

    Loading source...
    Loaded 42 assets
    Manifest found
    No assets found
    Auth failed

------------------------------------------------------------------------

# Recommended Implementation Phases

## Phase 1 -- Core UX

1.  Responsive layout
2.  Scrollable panels
3.  Clickable cards
4.  Asset viewer modal

## Phase 2 -- Workspace Features

5.  Multi-source support
6.  Source badges
7.  Source manager

## Phase 3 -- Curation Workflow

8.  Metadata grouping
9.  Search and filters
10. Manifest validation

------------------------------------------------------------------------

# Vision

The TimeMap Collector is evolving into a media curation tool for open
collections.

    multiple open sources
    ↓
    visual asset browser
    ↓
    metadata editing
    ↓
    curated manifest export

This workflow supports cultural heritage institutions managing
distributed media collections.
