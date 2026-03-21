# Publish a collection to GitHub

This companion note supports the end-user guide at `site/docs/publish-a-collection.html`.

It covers the practical publishing chain for Open Collections Desktop or Collection Manager:
- GitHub account ownership
- public repository setup
- Personal Access Token (PAT) creation
- saved GitHub destination configuration in Open Collections
- publishing collection files into the repository
- opening the published collection on the web

## Recommended defaults
- **Branch:** `main`
- **Publish path:** `/collections/`
- **Other possible paths:** `/opencollections/`, `/webcollections/`

`/collections/` should be treated as the recommended neutral default unless an organization already has another established pattern.

## Why this path is user-facing
This workflow is intended to be understandable for non-technical and lightly technical collection teams.

A simple conceptual explanation helps:
- GitHub account = who owns the repository
- repository = where published files are stored
- PAT = permission token used by Open Collections to publish
- destination = saved connection details inside the app
- publish = upload or update collection files
- URL path = where the public collection opens in the browser

## Product note
In many organizations, a technical or admin person may prepare the destination once and then hand normal users a ready-to-use publish destination.

That means ongoing collection users may only need to:
1. choose the prepared destination
2. choose or confirm the collection slug
3. publish
