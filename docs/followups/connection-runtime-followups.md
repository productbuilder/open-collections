# Connection/Runtime Refactor Follow-ups

## Why this follow-up exists
During the connection/runtime refactor, we identified a few important resilience and UX gaps that should be handled in a later phase. This note captures those ideas so they are not lost, without expanding the current refactor scope.

## Follow-up 1: Browser reconnect UX

### Problem
In browser mode, a reload may preserve remembered connection definitions, but access is not always silently restorable. This can leave users unsure why a previously available connection is no longer active.

### Desired direction
Provide a clear reconnect experience (prompt, dialog, or list) for remembered connections that cannot be auto-restored after reload.

### Constraints / notes
- Browser sessions may remember connection definitions but still fail automatic access restoration.
- Local folder connections may require user re-authorization.
- Incognito/private sessions should be treated as ephemeral and best-effort.
- Reconnect UX should degrade gracefully in incognito/private mode.
- This likely belongs naturally in the connector app / Connect flow in a later phase.

## Follow-up 2: Collection manifest robustness

### Problem
Invalid `collection.json` or `collections.json` files can currently risk blocking startup or blocking all built-in/example loading, which is too brittle as more users author manifests.

### Desired direction
Improve manifest handling so malformed files do not cause full-system failure.

### Constraints / notes
- Future users will create many manifests and will make mistakes.
- Expected mistakes include:
  - Missing required properties.
  - Misspelled properties.
  - Unknown properties.
  - Partial migrations / schema drift.
- System direction should include:
  - Graceful partial loading.
  - Structured validation errors.
  - Non-fatal handling where possible.
  - Better author feedback.
- Future author feedback could include validation reporting and possibly email/reporting workflows; implementation details are intentionally not specified here.

## Suggested later phase (not for current refactor)
Treat both items as post-refactor hardening work. Keep current changes focused on the connection/runtime refactor itself; do not expand into UX or schema-system rewrites in this pass.

## Open questions
- Where should reconnect state and prompts live across shell vs connector boundaries?
- What is the minimum validation contract needed to safely continue partial loading?
- What user-facing error format best supports both local debugging and future reporting workflows?
- How should built-in/example collection loading be isolated from user-authored manifest failures?
