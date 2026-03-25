# Datasets and Curated Collections

## Overview

This note proposes a clearer distinction in Open Collections between **datasets** and **collections**.

That distinction matters because larger institutions, archives, libraries, and research organizations often already have systems of record, stable record URLs, stable media URLs, and large harvested corpora. In those cases, Open Collections should not assume that every imported body of material is itself a collection.

A useful framing is:

- **datasets** are broad source bodies
- **collections** are curated selections

This is a product and model direction, not a final technical specification. The goal is to guide messaging, product design, protocol thinking, and frontend UX.

## 1. Why this distinction matters

Not every large corpus should be treated as a collection.

Many organizations may want to bring tens of thousands of records into Open Collections as a usable source body without claiming that the full import is a coherent public-facing collection. A harvested archive export, catalog feed, or institutional corpus may be valuable to browse and filter, but it is often too broad, too uneven, or too system-shaped to function well as a collection.

Treating every corpus as a collection creates confusion:

- it blurs the difference between source material and curated presentation
- it makes product language less precise
- it can force institutions into workflows that do not match how their data already exists
- it makes collection creation feel like a bulk import event rather than an intentional act

A clearer distinction lets Open Collections support both realities:

- large source bodies that come from existing systems
- smaller intentional groupings shaped for use, interpretation, and publication

## 2. What is a dataset?

In this framing, a **dataset** is a larger source body of records.

Datasets will often:

- be harvested or imported from an existing system
- contain many records, sometimes at institutional scale
- preserve source metadata as received or lightly normalized
- preserve source identifiers, source record URLs, and source media references
- act as the broader body from which curated work begins

A dataset is not primarily defined by narrative shape. It is primarily defined by provenance and scope.

For Open Collections, datasets may be the right model when an organization wants to:

- bring in a large corpus from an archive, DAMS, CMS, or catalog
- keep a visible link back to the system of record
- support filtering, search, and exploration across a broad imported body
- create multiple downstream collections from the same source material

This means datasets can be useful even when no immediate curation has happened yet.

## 3. What is a collection?

A **collection** is curated, intentional, and shaped for use.

Collections are selections or grouped subsets assembled for a reason. They may support:

- sharing
- teaching
- storytelling
- exhibitions
- research
- publication
- thematic grouping
- editorial or institutional presentation

A collection may come from a dataset, combine records from multiple datasets, or include a mix of records, files, and external links.

The key point is that **collections are not just “everything we harvested.”** A collection should imply some degree of judgment, framing, grouping, or purpose.

That purpose may be light or heavy:

- a simple selected set for a classroom or project
- a themed grouping for public browsing
- an exhibition set with stronger editorial framing
- a reusable research subset with clear inclusion logic

Collections are intentional.

## 4. Suggested product model

A useful layered model for Open Collections is:

1. **Source system / system of record**  
   The original archive, catalog, CMS, DAMS, repository, or records platform.
2. **Dataset**  
   A harvested or imported source body preserved in Open Collections with source references intact where possible.
3. **Filtered views / facets / slices**  
   Ways of exploring the dataset by criteria, topic, media type, date, creator, geography, or other dimensions.
4. **Curated collections**  
   Intentional subsets or groupings shaped for browsing, sharing, teaching, storytelling, research, or publication.
5. **Published outputs**  
   Public-facing pages, embeds, exported manifests, exhibitions, partner experiences, or other downstream presentations.

This layered model helps Open Collections avoid collapsing every use case into one container type.

It also suggests a practical workflow:

- ingest or connect to source material
- preserve provenance and source links at the dataset layer
- support exploration and filtering across the broader body
- let users create curated collections from selected subsets
- publish focused outputs without losing connection to source context

## 5. Referenced vs managed media implications

This distinction also connects to media handling.

In many institutional settings, some media should remain externally referenced rather than copied into collection-managed storage. A dataset may preserve links to source-hosted media because those URLs are stable, governed, and already managed elsewhere.

Curated collections, meanwhile, may include a mix of:

- externally referenced media carried through from the source system
- collection-managed media added, copied, optimized, or republished for the collection experience

This suggests that Open Collections should support both patterns without requiring one universal media lifecycle.

## 6. Adoption guidance for larger organizations

This framing is especially useful for adoption by larger organizations.

Open Collections does not need to replace the existing archive system, DAMS, or catalog. Instead, it can add value on top of those systems by supporting:

- curation
- public presentation
- publishing workflows
- better browsing experiences
- reusable subsets and thematic outputs

That lowers adoption friction.

Organizations can keep:

- their existing system of record
- their stable record URLs
- their stable media URLs
- their existing metadata stewardship processes

At the same time, Open Collections can provide:

- imported or connected datasets
- curated collections derived from those datasets
- preserved links back to source records and media
- a cleaner public-facing layer for exploration and reuse

This makes Open Collections a complementary layer rather than a forced replacement.

## 7. Narrative guidance

Recommended language for docs, site copy, and product framing:

- **Open Collections helps you work with datasets and turn selected records, files, and links into curated collections.**
- **Datasets are broad source bodies; collections are curated selections.**
- **Collections are intentional.**
- **Not every import is a collection.**
- **Use datasets to preserve source context; use collections to shape public-facing experiences.**

Useful narrative principles:

- lead with clarity about source material versus curated output
- avoid implying that harvesting alone creates a meaningful collection
- describe collections as shaped for use, not merely accumulated
- leave room for both lightweight and deeply editorial curation

## 8. Product and UX implications

This distinction has practical implications for product design.

### Browser

The Browser may need to support large, filterable datasets as a distinct experience from curated collections. A broad dataset view may emphasize search, facets, scale, and provenance, while a curated collection view may emphasize narrative shape, selected items, ordering, and presentation.

### Manager

The Manager may need to support creating collections from dataset subsets rather than assuming every workflow begins with a blank collection or a complete import becoming one collection.

Useful capabilities may include:

- selecting records from a dataset into a new collection
- saving filtered subsets as starting points
- preserving links back to dataset records
- mixing imported records with newly added files or links

### Publishing

Publishing may need to support both:

- focused curated collections
- larger browseable dataset views

Those outputs may share underlying records while serving different public purposes.

## Closing note

This distinction should be treated as a useful direction for Open Collections, not as a rigid final model.

The main proposal is simple: Open Collections should make room for **datasets as broad source bodies** and **collections as curated selections**. That separation can improve product language, lower adoption barriers, better fit institutional workflows, and create a stronger foundation for future model and UX decisions.
