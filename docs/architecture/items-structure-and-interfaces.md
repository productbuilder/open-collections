# Items, Structure, and Interfaces

## Overview

Open Collections starts from **items** as the common base unit.

An item may represent a person, organization, place, event, object, or story. Items are intentionally lightweight and portable so they can be reused across applications and views without redefining the underlying record each time.

Core principle: **Interfaces emerge by adding structure to items.**

## Core model

| question | dimension | entity | data (type) | data (examples) | interface / app |
|---|---|---|---|---|---|
| where | spatial | place | geo data | coordinates, geometry, area | map |
| who | relational | actor | relationship data | person, org, connections, roles | network |
| when | temporal | event | time data | start date, end date, duration | timeline |
| what | descriptive | thing | object data | properties, attributes, media | collection / detail view |
| why | contextual | narrative | context data | intent, meaning, sequence, story | board / narrative |

Column meanings:

- **question**: the guiding question users ask while exploring.
- **dimension**: the structural dimension applied to items.
- **entity**: the conceptual entity emphasized by that dimension.
- **data (type)**: the category of structure needed to support that interface.
- **data (examples)**: representative examples of the structure, not a fixed schema.
- **interface / app**: the interface type that emerges when this structure is available.

## How the model works

The model can be understood as three layers:

1. **item layer**: base items with shared identity and summary information.
2. **structural data layer**: additional structure that answers where/who/when/what/why.
3. **interface layer**: derived interfaces that present the same items through a specific dimension.

In practice, this creates a direct parallel:

- **map** = items + geo data
- **timeline** = items + time data
- **network** = items + relationship data
- **collection** = items + object data
- **narrative** = items + context data

The collection/detail view acts as the base descriptive interface. Map, timeline, and network act as structured exploration interfaces derived from the same underlying items.

### Relationship to existing architecture

This model aligns with current LinkedCollections direction: simple collection manifests, progressive loading, and multiple visual explorers derived from shared collection data. It describes a conceptual frame for reuse across Collector, Browser, and related app-shell interfaces rather than introducing a new protocol.

## Key principle: the same item in multiple interfaces

The same person, object, event, or place can appear in collection, detail, map, timeline, network, and narrative contexts when the corresponding structure is present.

This preserves consistency while enabling interface reuse: one underlying item can support many exploration modes without duplication of meaning.

## Network / relational layer

The network layer is special because it requires **relationships as first-class data**. It is not only items positioned differently; it is items connected by explicit relational structure.

- **nodes** = items
- **edges** = relationships

Relationship data may include:

- type
- role
- optional time metadata
- optional strength metadata

## Network design principles

Network interfaces should stay practical and legible:

- start from one item
- show direct relationships first
- reveal complexity progressively
- group relationships by type
- prefer controlled layouts over chaotic full-graph defaults

A layered relationship model helps keep the interface simple and fast:

- **layer 0** = selected item
- **layer 1** = direct relations
- **layer 2** = secondary relations
- **layer 3** = extended graph

The goal is an interface that remains understandable while still allowing deeper exploration when needed.

## Supporting interfaces

Detail view and infocard patterns are cross-cutting interface components, not primary data dimensions. They can be used across map, timeline, network, collection, and narrative contexts to keep item reading and comparison consistent.

## Summary

Items are the foundation. Structure organizes items. Interfaces emerge from structure.

**Items become interfaces when structure is added.**
