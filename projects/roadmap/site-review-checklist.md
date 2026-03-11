# Open Collections Protocol Site Post-Implementation Review Framework

This is a practical review tool for evaluating the site after roadmap implementation. Use it as a repeatable pass, then convert findings into the backlog structure at the end of this document.

## 1) Core terminology (must stay consistent)

Use these terms exactly and consistently:

- **Open Collections Protocol** = umbrella public framing.
- **LinkedCollections** = architecture.
- **DCD (Domain Collections Discovery)** = discovery mechanism.
- **Collection Manager** = editing/publishing tool and embeddable component.
- **Collection Browser** = viewing/browsing tool and embeddable component.
- **Collection Registry** = public-facing registry tool.
- **Registrator** = internal architectural term.
- **Collection Indexer** = indexing/processing tool.
- **TimeMap** = exploratory presentation layer.

### Terminology review rules
- Prefer public-facing names on top-level pages.
- Use **Registrator** only where internal architecture context is explicitly needed.
- Avoid introducing alternate names for the same concept on different pages.
- When a page references multiple tools, ensure role boundaries are explicit (e.g., Registry vs Indexer).

---

## 2) Acceptance checklist (release-gate style)

Mark each item as `[ ]` not done, `[~]` partial, `[x]` complete.

### A. Naming consistency
- [ ] Core terms above are used correctly and consistently across all reviewed pages.
- [ ] No conflicting synonyms are used for the same concept.
- [ ] Any use of internal terminology is clearly labeled as internal.

### B. Audience fit
- [ ] Home and top-level narrative are understandable to non-technical readers.
- [ ] Documentation provides a clear entry path for non-technical vs technical readers.
- [ ] Developer-focused details are present but do not obscure core public framing.

### C. Information architecture
- [ ] Primary navigation is consistent across key pages.
- [ ] Major topics are discoverable within 1-2 clicks from Home or Documentation.
- [ ] Related pages cross-link where users naturally need next steps.

### D. Page completeness
- [ ] Each core page has a clear purpose statement.
- [ ] Each page includes enough content to be useful (not placeholder-thin).
- [ ] Each page links to at least one logical next step.

### E. Navigation consistency
- [ ] Global nav labels are consistent and ordered similarly across pages.
- [ ] No key page is orphaned from main nav and relevant cross-links.
- [ ] Documentation subpages include a clear path back to docs index.

### F. Responsiveness and readability
- [ ] Layout remains usable on mobile and desktop widths.
- [ ] Line lengths, headings, and spacing support scanning.
- [ ] Tables/lists/code blocks are readable without breaking layout.

### G. Ecosystem clarity
- [ ] Site clearly communicates how Protocol, architecture, tools, and discovery fit together.
- [ ] Distinction is clear among Collection Manager, Browser, Registry, Indexer, and TimeMap.
- [ ] Storage and integration options are explained as ecosystem components, not isolated pages.

### H. Registry / Indexer / WordPress documentation quality
- [ ] Registry docs explain audience, purpose, and public-facing role.
- [ ] Indexer docs explain processing/indexing role and relationship to Registry.
- [ ] WordPress integration docs explain what is supported, when to use it, and limitations.
- [ ] All three areas provide practical linking to adjacent docs/tools.

---

## 3) Page-by-page review rubric

Score each criterion from **0-2**:
- **0** = missing/incorrect
- **1** = present but incomplete/unclear
- **2** = clear, complete, and aligned

Recommended threshold: average score **>= 1.5** per page, with no critical criterion at 0.

### Common criteria for every page
- Naming alignment
- Audience fit
- Information architecture fit (placement and linking)
- Content completeness
- Navigation consistency
- Readability/responsiveness

### Page review matrix

| Page | Primary intent to verify | Must-pass checks |
|---|---|---|
| Home | Public narrative anchor for Open Collections Protocol | Correct umbrella framing; clear ecosystem summary; obvious paths to Protocol/Tools/Docs/Demo |
| Protocol | Explain protocol framing and architecture relationship | Open Collections Protocol vs LinkedCollections distinction is explicit; DCD is clearly positioned |
| Tools | Clarify tool roles in ecosystem | Manager/Browser/Registry/Indexer/TimeMap roles are distinct and non-overlapping |
| Storage | Explain storage/provider model | Storage options are understandable; links to implementation docs are present |
| Documentation | Route audiences effectively | Non-technical and technical entry paths are obvious and balanced |
| Demo | Show practical value quickly | Demo purpose is clear; context links back to protocol/tools/docs |
| Registry / Indexer docs | Document complementary backend/public roles | Registry public role and Indexer processing role are both clear and cross-referenced |
| WordPress integration docs | Explain integration pathway | Scope, setup path, and relationship to Manager/Browser/components are clear |

### Review log template (copy per page)

```markdown
#### Page: <name>
- URL/path:
- Reviewer/date:

Scores (0-2):
- Naming alignment:
- Audience fit:
- IA fit:
- Completeness:
- Navigation consistency:
- Readability/responsiveness:

Notes:
- Strengths:
- Issues:
- Recommended fixes:

Backlog candidates created:
- <ID/title>
```

---

## 4) Backlog structure (post-review triage)

Create and maintain backlog items grouped by impact and urgency.

## Critical (fix before broad promotion)
Use for issues that:
- Break core narrative accuracy.
- Misname or conflate major concepts (e.g., Registry vs Indexer).
- Block key user journeys (can’t find docs/tools/next steps).
- Cause severe mobile/readability failures.

## Important (next iteration)
Use for issues that:
- Reduce clarity but do not break core understanding.
- Leave pages partially complete or weakly linked.
- Create moderate UX friction in navigation or page flow.

## Later (quality improvements)
Use for issues that:
- Improve polish, examples, or depth.
- Add optional diagrams, FAQs, or richer cross-linking.
- Refine wording after critical/important issues are resolved.

### Backlog item template

```markdown
- ID: SR-###
- Title:
- Priority: Critical | Important | Later
- Affected page(s):
- Problem summary:
- Evidence (quote/link/screenshot):
- Fix recommendation:
- Owner:
- Status: Todo | In Progress | Done
```

### First-pass triage guidance
1. Convert every rubric score of **0** into a backlog item.
2. Convert repeated score **1** patterns across multiple pages into one cross-cutting item plus page-specific tasks.
3. Re-run this checklist after Critical items are complete.
