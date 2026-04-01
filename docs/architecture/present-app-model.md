# Present app model

## Summary
Present is intended to be a grid of saved presentation items, not a one-off app surface. The Present area should behave like a product workspace where users create, manage, and open saved presentation outputs.

Core model:

- A **presentation item** is a JSON object containing saved presentation settings/configuration.
- An **app template** is a self-contained Web Component that loads one or more presentation items and renders the presentation.
- The **create/configure flow** is a guided multi-step sequence (slides/steps) used to define the settings/options required by a template.

## Goals
- Make Present a clear product area for viewing presentations.
- Treat configured apps as saved items.
- Allow users to add presentations from templates.
- Keep opening/rendering consistent with existing item viewer patterns.
- Make the system extensible for multiple presentation types.

## Non-goals
- Building every presentation type immediately.
- Treating apps as unsaved temporary tools.
- Introducing a separate storage model disconnected from items.

## Product concept
The intended user mental model:

- Present is a grid, similar in spirit to Browser and Collect.
- Each card in the grid is a saved presentation item.
- Users click **Add app**.
- Users select an app template.
- Users configure that template through a setup flow.
- Users save it.
- The saved result appears as an item in the Present grid.
- Clicking the saved presentation item opens a dialog/viewer that loads the appropriate template, similar to opening an image item.

## Terminology
- **Present**: the app area for browsing and opening saved presentation items.
- **Presentation item**: a JSON object that stores a saved configuration for one presentation instance. It is data, not app code.
- **App template**: a self-contained Web Component presentation template (for example `time-comparer`) that renders output from one or more presentation items.
- **Create/configure flow**: a guided multi-step experience (slides/steps) that collects template-specific configuration inputs.
- **Viewer/dialog renderer**: runtime renderer used when opening an item in a viewer/dialog.

User-facing **Add app** maps internally to creating a saved presentation item from a template.

## Present grid
Intended grid behavior:

- Present shows saved presentation items in a grid.
- Cards may show title, preview, type badge, and summary.
- Presentation items are opened by clicking their card.
- Opening uses dialog/viewer behavior consistent with existing item interactions and loads the selected item's template renderer.

## Add app flow
1. User clicks **Add app**.
2. User sees available app templates.
3. User picks a template (for example `time-comparer`).
4. User goes through that template's create/configure flow (multi-step slides/steps).
5. System saves the configured result as a presentation item.
6. Item appears in the Present grid.

## App template picker
Each template option should provide:

- Name
- Short description
- Preview/icon
- Optional use-case explanation

Initial and future examples:

- `time-comparer`
- `slideshow`
- `timeline`
- story/map/gallery-style templates (future)

## Configuration flow
Each template owns its own setup flow and validation.

Example setup flow for `time-comparer`:

- Choose past image
- Choose present image
- Set labels
- Choose default split position
- Save

This keeps template-specific logic decoupled while preserving a shared creation pattern.

## Presentation item model
Configured presentations should be saved as items with presentation-specific metadata.

Practical target shape:

```json
{
  "id": "presentation-001",
  "type": "presentation",
  "presentationType": "time-comparer",
  "title": "Street then and now",
  "summary": "Historic street comparison",
  "config": {
    "pastItemId": "image-old-1",
    "presentItemId": "image-new-1",
    "pastLabel": "1910",
    "presentLabel": "2024",
    "initialSplit": 0.5
  }
}
```

Important distinction:

- The presentation item above is persisted JSON configuration/state.
- The template code (for example the `time-comparer` Web Component) lives separately and is loaded by the viewer when rendering the item.

Implementation note: the current `time-comparer` README shows `compare` and `settings` sections. The model above is a product-level envelope and can be mapped to the current shape during incremental migration.

## Rendering model
Opening behavior should follow existing item interaction patterns:

- Image items open the image viewer.
- Presentation items open a presentation viewer.
- Renderer is selected by `type` and, for presentation items, `presentationType`, then the corresponding template/component renders from item `config`.

This preserves a consistent user interaction model while allowing custom presentation rendering.

## Template architecture
Each presentation template should define:

- Metadata
- Config schema
- Create/configure flow (step-based slides/steps)
- Renderer component
- Preview/card strategy

`time-comparer` is the first concrete example of this template model:

- `time-comparer` is the template/component.
- A `time-comparer` presentation item stores saved config JSON.
- The `time-comparer` create/configure flow is a step-based setup sequence.

## Why this model
Compared with treating apps as separate floating tools, this model makes presentations:

- Persistent
- Discoverable in the grid
- Editable later
- Consistent with existing viewer behavior
- Scalable to additional presentation types

## MVP recommendation
Practical MVP:

- Present grid exists.
- **Add app** opens a template picker.
- `time-comparer` is the first template.
- `time-comparer` setup flow creates a saved presentation item.
- Saved presentation item appears in the grid.
- Clicking it opens existing dialog/viewer renderer pathways.

## Future extensions
Possible later templates:

- `slideshow`
- `timeline`
- story sequence
- map-based presentation
- gallery presentation

## Open questions
- Should **Add app** remain the user-facing label, or become **Add presentation**?
- Should Present show only presentation items, or support mixed display modes later?
- How should editing existing presentation items work?
- What metadata belongs at item level vs config level?
- How should previews/thumbnails be generated per template?
