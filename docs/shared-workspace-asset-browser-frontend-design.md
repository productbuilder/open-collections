# Shared Workspace / Asset Browser Frontend Design

## Overview

This note describes a proposed frontend design for a shared workspace / asset browser layer that can support both Productbuilder and Open Collections.

The goal is to define a reusable browser and workspace foundation for bucket-backed assets, local working copies, and domain-specific workflows without limiting the design to collection-specific browsing.

This document is the frontend counterpart to the broader storage and workspace architecture: shared bucket-backed storage as the canonical layer, a desktop client as the main working environment, a local SQLite index/cache for fast local state, and explicit local working-copy workflows.

## 1. Purpose of the Shared Frontend Layer

The shared frontend layer should provide a common browser/workspace experience for:

- browsing shared bucket-backed assets
- navigating workspaces, folders, and files
- understanding local versus remote state
- managing explicit local working copies
- supporting higher-level domain-specific workflows on top

This is broader than Open Collections alone.

Open Collections can build on this layer for datasets, curated collections, collection items, metadata, and publishing workflows. Productbuilder can use the same layer for project work, delivery flows, reviews, and domain-specific operational states.

The shared layer should therefore be treated as infrastructure for interaction, not as a collection-specific UI. It is the base browser experience used to understand what exists in shared storage, what is available locally, what is selected for work, and what can be opened, previewed, downloaded, edited, or synchronized.

## 2. Core UI Concept

The primary concept should be a **workspace browser** or **shared asset browser**, not just a filesystem clone.

The browser should feel more structured and workflow-aware than a generic file explorer. It should support:

- fast navigation across shared workspaces and nested paths
- clear visual distinction between local and remote state
- quick preview of assets
- details and metadata inspection
- working-copy actions such as download, check out, upload, and check in
- bulk actions across multiple selected assets
- future project, dataset, or collection context layered into the same browsing experience

The frontend should present assets as part of an operational workspace, not only as files in a tree. That means the UI should make room for storage state, previewability, actionability, and domain context while remaining understandable to non-technical users.

## 3. Proposed UI Layout

### Desktop layout

A desktop-first layout should provide a stable multi-panel workspace:

- **Top:** workspace toolbar and global controls
- **Left:** workspace selector plus workspace tree / folder tree
- **Center:** main browser viewport for folders, assets, and search results
- **Right:** details / metadata panel for the currently focused asset
- **Bottom or status edge:** sync state, index state, and background activity

A representative desktop structure:

```text
┌─────────────────────────────────────────────────────────────┐
│ Workspace toolbar / search / view controls / actions       │
├───────────────┬───────────────────────────────┬─────────────┤
│ Workspace     │ Browser viewport              │ Details     │
│ tree          │ - card grid or row list       │ panel       │
│ - workspaces  │ - inline state badges         │ - metadata  │
│ - folders     │ - bulk selection affordances  │ - actions   │
│ - recents     │ - empty/loading states        │ - history   │
├───────────────┴───────────────────────────────┴─────────────┤
│ Status / sync / indexing / background tasks                │
└─────────────────────────────────────────────────────────────┘
```

This layout keeps navigation, browsing, and inspection visible at the same time. It also supports the important distinction between selection, focus, and preview without overloading a single panel.

### Mobile layout

Mobile should preserve the same mental model, but compress it into a browser-first flow:

- the tree collapses into a drawer or route-level panel
- the browser viewport becomes the primary visible surface
- tapping an item focuses it and can open the details panel as a sheet or slide-over panel
- preview should remain a separate viewer surface where needed
- toolbar actions should collapse into lightweight menus
- bulk actions should appear only after selection begins

The mobile experience should prioritize quick navigation and focused task flows rather than trying to display the full desktop multi-panel layout at once.

## 4. Proposed Component Architecture

A web-component-based architecture is a good fit for a reusable shared browser because it allows the core UI building blocks to be used across Productbuilder, Open Collections, and future surfaces.

Suggested shared components:

- `workspace-app-shell`
- `workspace-toolbar`
- `workspace-tree`
- `workspace-browser-viewport`
- `workspace-card-grid`
- `workspace-row-list`
- `workspace-details-panel`
- `workspace-preview-viewer`
- `workspace-status-bar`
- `workspace-bulk-action-bar`

### Component responsibilities

**Workspace app shell**
- owns the high-level page layout
- hosts shared navigation, panels, and status regions
- coordinates responsive layout rules

**Workspace toolbar**
- workspace switching
- search input
- view mode toggles
- high-level actions and filters

**Workspace tree**
- shows workspaces, folders, pinned locations, and recent locations
- supports navigation and collapse/expand interactions

**Workspace browser viewport**
- container for result state, list/grid rendering, empty states, and loading states
- decides whether the current content is shown as cards, rows, or another layout

**Workspace card grid / row list**
- render asset summaries
- expose selection, focus, and action affordances
- remain presentation-oriented rather than storage-aware

**Workspace details panel**
- shows metadata, storage status, local copy state, and available actions for the focused asset

**Workspace preview viewer**
- renders image, audio, video, document, or structured previews
- can open inline, in a panel, or in a dedicated viewer route/dialog

**Workspace status bar**
- shows indexing state, sync state, background tasks, connectivity, or warnings

**Workspace bulk action bar**
- appears when selection is active
- exposes actions relevant to multiple assets

### Architectural rules

These components should remain UI-focused.

Storage logic, database calls, sync operations, and runtime-specific APIs should not be embedded directly inside visual components. Components should receive state and actions through a controller/service boundary.

That separation makes it easier to:

- reuse components across applications
- test the UI in isolation
- swap desktop and web runtime adapters
- layer domain-specific behaviors on top without rewriting the shared browser foundation

Domain-specific layers should wrap, configure, or extend these shared components rather than fork them by default.

## 5. State Model

The frontend should explicitly model several distinct kinds of state.

At minimum, the shared browser should track:

- **active workspace**: which shared workspace or bucket-backed source the user is in
- **active path / folder**: the current navigated location within that workspace
- **current view mode**: card grid, row list, split view, or future variants
- **selected assets**: the set of assets chosen for bulk actions
- **focused asset**: the single asset currently driving the details panel
- **preview asset**: the asset currently shown in the preview/viewer
- **search query**: current text query
- **filters**: type filters, local/remote filters, metadata filters, domain-specific facets
- **sort mode**: current ordering rule for the viewport
- **mobile panel state**: whether the tree drawer or details panel is open on mobile

These distinctions are important and should remain explicit:

- **selected asset(s)** are for bulk actions
- **focused asset** drives the details panel
- **preview asset** drives the viewer

These should not be conflated into a single “current item” state.

A user may select ten assets for bulk download, focus one of them to inspect metadata, and preview a different asset in the viewer. The UI should preserve those states cleanly.

Additional useful shared state may include:

- recent locations
- pending transfers
- background indexing progress
- connectivity state
- cached thumbnail availability
- inline error and warning states

## 6. Data / Service Boundary

The frontend should rely on a service or adapter layer rather than talking directly to storage and database APIs from UI components.

A useful boundary looks like this:

1. **Frontend components**  
   Presentation-oriented web components and layout primitives.
2. **App / controller / state layer**  
   Coordinates navigation state, selection state, view state, and actions.
3. **Workspace service / data adapter**  
   Provides workspace browsing, metadata retrieval, search, sync actions, and working-copy operations through a stable interface.
4. **Runtime-specific backend**  
   Tauri desktop bridge, browser/web implementation, or other host-specific integration.

This separation allows the same frontend architecture to support multiple runtimes:

- **Tauri / desktop adapter** for the primary desktop application
- **browser / web adapter** for lighter web-based browsing experiences
- **test / mock adapter** for isolated component testing and local development

This also keeps the shared browser from becoming tightly coupled to one storage mechanism or one application shell.

## 7. Shared Core vs Domain-Specific Frontend Layers

The frontend should be structured in layers.

### Shared core browser layer

The shared core browser layer is responsible for:

- workspace browsing
- folder and path navigation
- asset discovery
- preview surfaces
- local/remote state indicators
- working-copy actions
- sync/index visibility
- reusable search and filtering patterns

This layer should not assume that the user is always working on a collection, a dataset, or a Productbuilder project. It is the general-purpose workspace surface.

### Open Collections layer

The Open Collections layer adds domain-specific concepts such as:

- datasets
- curated collections
- collection items
- collection-specific metadata
- publishing workflows
- later linked/reused collection logic

This layer may add badges, panels, filters, creation flows, and metadata editors that sit on top of the shared browser state and components.

### Productbuilder layer

The Productbuilder layer adds domain-specific concepts such as:

- project workflows
- freelancer delivery flows
- approval and review flows
- domain-specific metadata and status models
- client-facing or team-facing operational states

This layer can reuse the same browser shell and browsing interactions while introducing different terminology, metadata, workflow steps, and action sets.

The key design principle is that the shared core owns workspace browsing, while domain layers own specialized meaning.

## 8. Interaction Model

The shared browser should support a consistent interaction model across desktop and mobile.

### Core interactions

- **Click item** → focus the item and update the details panel
- **Double-click item** or **open action** → navigate into folders or open an asset preview where appropriate
- **Checkbox/select affordance** → add or remove the item from the current selection for bulk actions
- **Preview action** → open the viewer with the chosen preview asset
- **Download / check out** → create or refresh a local working copy
- **Upload / check in** → sync a local working copy back to canonical storage
- **Navigate tree node** → update the active path and browser viewport
- **Search or filter** → update the viewport within the current workspace/path context

### Bulk action model

Bulk actions should operate on **selected assets**, not on the focused asset.

Example bulk actions may include:

- download / check out selected assets
- upload / check in selected assets
- move or organize selected assets where allowed
- tag or classify selected assets in domain-specific layers
- add selected assets into a collection or project workflow

When selection is active, the UI should make that mode visible through a bulk action bar and selection count.

### Search and filter behavior

Search should usually operate within the active workspace and current path scope by default, with room for later expansion into workspace-wide or cross-workspace queries.

Filters should be additive and visible. Users should be able to understand why a result set looks the way it does without hidden state.

### Desktop vs mobile interaction differences

On desktop:

- hover affordances are acceptable for secondary actions
- keyboard navigation and multi-select should be supported
- details and status can remain persistently visible

On mobile:

- tap targets must be explicit
- details should open as a sheet/panel rather than persistently occupying space
- multi-select should be deliberate and clearly mode-based
- preview should become a dedicated surface when needed

## 9. Initial Feature Scope for the Shared Browser

A realistic first version of the shared browser should include:

- workspace selector
- folder tree
- card view and/or row view
- details panel
- preview support for common asset types
- local/remote status badges
- download / check out action
- upload / check in action
- recent locations
- search within the current workspace or active path

This first version should aim to validate the core browsing and working-copy model rather than solve every collaboration and synchronization scenario immediately.

A good initial goal is a browser that lets a user:

1. choose a workspace
2. navigate shared folders
3. inspect assets and metadata
4. understand local versus remote status
5. make a local working copy
6. upload or check changes back to canonical storage

That is enough to establish the shared browser as a useful foundation for both Productbuilder and Open Collections.

## 10. Follow-up Feature Directions

After the first version, the shared browser can expand toward richer collaborative and operational workflows.

Likely follow-up directions include:

- richer sync state and transfer progress
- conflict warnings and resolution guidance
- activity and history views
- annotations, relations, and linked asset context
- cross-collection or cross-project reuse views
- saved lists, bookmarks, and pinned working sets
- multi-user workflow indicators
- deeper offline state visibility
- richer recent/opened/assigned views

These should be layered on top of the core workspace browser without changing the basic mental model.

## 11. Design Principles

The frontend should follow a small set of durable design principles:

- **Local-first feel**  
  The interface should feel fast and dependable, especially when backed by local indexing and local working copies.

- **Clear separation of local vs remote state**  
  Users should be able to tell what is remote-only, what exists locally, what has changed, and what is ready to sync.

- **Explicit workflow over hidden magic**  
  Download/check-out and upload/check-in actions should be understandable and intentional.

- **Reusable components**  
  Shared browser primitives should be usable across multiple products and runtime environments.

- **Shared core, specialized layers on top**  
  The workspace browser should remain broadly useful while allowing Open Collections and Productbuilder to add richer domain behaviors.

- **Understandable for technical and non-technical users**  
  The UI should expose state clearly without assuming a developer-oriented mental model.

- **Workflow-aware, not filesystem-obsessed**  
  The browser can borrow familiar navigation patterns from file systems, but it should present assets as part of a working environment with preview, metadata, and action context.

## Closing Note

The shared workspace / asset browser should be treated as a common frontend foundation for shared storage-backed work, not as an Open Collections-specific browser.

Open Collections is one higher-level domain that can build on top of this foundation. Productbuilder can do the same. By keeping the core browser focused on navigation, state clarity, working-copy management, and reusable interaction patterns, the system can support multiple products without fragmenting the frontend architecture.
