# Open Collections Account App

Open Collections Account is the dedicated account-area app that will be mounted inside `app-shell`.

## Purpose

- Provide the account section without manager-style chrome.
- Host account-specific workflows in a focused main-content surface.
- Start with **connections management** as the first account flow.

## Current focus: connections management

The first implementation migrates the connection setup/maintenance workflow from Collection Manager dialogs into an in-page account view:

- list existing connections
- add new connections
- refresh/reconnect and repair connection credentials/folder access
- remove connections

## Relationship to future account settings

This app is structured as an account-area surface so additional views can be added over time, for example:

- user account settings
- workspace/account preferences
- other account-level configuration

For now, the account landing view is intentionally connections-first.

## Mounting direction

This app is mount-ready for the **Account** section within `app-shell` using the shared mount contract.

## Entry

- Source app host page: `/src/apps/collection-account/`
- Source web component script: `/src/apps/collection-account/src/index.js`


## Shared account runtime basis

Account now depends on shared account foundations from `src/shared/account/*` and shared host directory capability helpers in `src/shared/platform/host-directory.js`, instead of manager-local ownership.
