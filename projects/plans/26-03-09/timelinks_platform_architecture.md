
# TimeLinks / TimeMap Platform Architecture Plan

## Overview

This document describes the conceptual architecture for the **TimeLinks platform**, including the following components:

- Collector
- Registrator
- Indexer
- Viewer (TimeMap)
- Data format conventions
- Storage patterns
- Thumbnail strategy
- Sidecar metadata model
- Multi-source collections
- Open distributed storage principles

The goal of the system is to enable **distributed open collections of media that can be explored across time and space**, while remaining simple enough for cultural heritage institutions and individuals to use without complex infrastructure.

The platform should function as a **distributed media network**, similar in spirit to:

- Spotify for images
- A decentralized Flickr / Instagram for heritage
- An open registry for time-based visual collections

The system intentionally separates:

Publishing → Discovery → Indexing → Viewing

This keeps the architecture modular and scalable.

---

# Core Platform Components

## 1. Collector

The **Collector** is a client-side application used to:

- Browse media assets from multiple sources
- Edit and manage metadata
- Curate collections
- Export collection manifests
- Publish metadata to storage providers

The Collector acts as the **authoring and curation tool** for collections.

### Key principles

- Works with **distributed storage providers**
- Supports **multiple read sources**
- Allows **explicit publish destinations**
- Stores metadata using **open JSON formats**
- Does not require a centralized database

### Supported source types

Examples include:

- GitHub repositories
- Public URL manifests
- S3-compatible storage
- Google Drive
- Dropbox
- Wikimedia Commons
- Internet Archive
- Local file sources (optional)

Sources can be:

- Read-only
- Authenticated read
- Read/write (publish destination)

### Workspace model

The Collector maintains a workspace containing:

Workspace
    sources[]
    assets[]
    filters
    collection manifest

Multiple sources can be loaded simultaneously.

Assets are normalized internally and displayed in a unified browsing interface.

---

# 2. Registrator

The **Registrator** is responsible for discovering and registering collections.

It maintains a list of known collections.

### Purpose

The Registrator allows systems to discover collections without requiring centralized hosting.

Example responsibilities:

- store collection URLs
- store collection metadata
- expose collection registry API
- allow collections to register themselves

### Registry example

Registry
    collections[]
        id
        title
        description
        url
        publisher
        tags
        geographic coverage
        temporal coverage

Registries can exist at multiple levels:

- global registry
- national heritage registry
- institutional registry
- community registry

Registries may be federated.

---

# 3. Indexer

The **Indexer** processes collections and prepares them for fast exploration.

Responsibilities:

- fetch collection manifests
- resolve media URLs
- generate thumbnails
- extract metadata
- build search indexes
- build spatial indexes
- build temporal indexes

### Index pipeline

collection.json
    ↓
fetch items
    ↓
normalize metadata
    ↓
generate thumbnails
    ↓
store index
    ↓
serve viewer APIs

The Indexer allows the viewer to operate quickly without directly querying each source.

---

# 4. Viewer (TimeMap)

The **Viewer** provides a user-facing interface to explore indexed collections.

The viewer allows browsing by:

- location (map)
- time (timeline)
- collection
- tags
- themes

### Viewer concept

Users can:

- explore images geographically
- scroll through historical time
- jump between related collections
- view large images and metadata

Example use cases:

- historical city maps
- archaeological photo archives
- community memory collections
- environmental change documentation

---

# Storage Model

The platform is built around **open storage systems**.

Media and metadata remain stored at the source.

Examples:

- GitHub
- S3
- static websites
- institutional repositories
- archive platforms

The system does not require a central database.

---

# Collection Data Format

Collections are described using a simple JSON manifest.

Example:

{
  "id": "amsterdam-harbor",
  "title": "Amsterdam Harbor Collection",
  "description": "Historic harbor images and maps",
  "items": [
    {
      "id": "harbor-1701",
      "title": "Harbor Chart 1701",
      "date": "1701",
      "location": {
        "lat": 52.37,
        "lon": 4.89
      },
      "media": {
        "type": "image",
        "url": "media/harbor-1701.jpg",
        "thumbnailUrl": "media/thumbs/harbor-1701.jpg"
      },
      "license": "CC-BY-4.0"
    }
  ]
}

The manifest describes the collection structure.

---

# Sidecar Metadata Model

Metadata can also be stored next to files using **sidecar JSON files**.

Example structure:

media/
    harbor-1701.jpg
    harbor-1701.json

Example sidecar:

{
  "title": "Harbor Chart 1701",
  "date": "1701",
  "location": {
    "lat": 52.37,
    "lon": 4.89
  },
  "license": "CC-BY-4.0"
}

Advantages:

- metadata travels with the file
- works in any storage provider
- easy to edit
- no database required

Sidecar files can also exist in a separate metadata directory.

---

# Thumbnail Strategy

Large images should not be used directly in map browsing.

Instead the Indexer generates thumbnails.

Example structure:

media/
    harbor-1701.jpg

thumbs/
    harbor-1701.jpg

Collection metadata may optionally include thumbnail URLs.

The Indexer ensures a thumbnail exists even if the source does not provide one.

Benefits:

- fast browsing
- reduced bandwidth
- better map performance

---

# Distributed Collection Model

Collections can exist anywhere on the web.

Example:

Museum A → GitHub collection
Archive B → S3 bucket collection
Community C → Static website collection

The Registrator stores the collection locations.

The Indexer fetches them.

The Viewer merges them into a single experience.

---

# Multi-Source Curation

The Collector allows curators to combine multiple sources.

Example workflow:

source A → archive collection
source B → museum collection
source C → community photos

↓

curate subset

↓

export new collection manifest

This allows:

- storytelling collections
- curated exhibitions
- educational datasets

---

# Open Platform Principles

The system follows several core principles.

### Open storage

Media remains on the original storage provider.

### Open formats

Metadata is stored as simple JSON.

### Distributed architecture

No central database is required.

### Pluggable providers

New storage providers can be added easily.

### Verifiable collections

Collections can optionally include hashes or signatures for verification.

---

# Future Extensions

Possible future additions include:

- decentralized identity for publishers
- cryptographic signatures for manifests
- blockchain anchoring for provenance
- social features such as comments or annotations
- recommendation systems
- AI-assisted metadata enrichment

---

# Platform Vision

The platform aims to become:

A distributed network for publishing and exploring visual collections across time and space.

It combines:

- open data principles
- distributed storage
- visual exploration
- heritage preservation

The result is a system where institutions, communities, and individuals can publish media collections that become part of a shared global visual history.
