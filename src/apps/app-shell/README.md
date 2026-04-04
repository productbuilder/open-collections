# Open Collections App Shell

`app-shell` is the shared shell container for Open Collections sub-apps.

## Purpose

The shell owns:

- global navigation
- section-level app mounting
- shared host runtime seams (notifications/capabilities)

## Embedded section mapping

`app-shell` mounts these sub-apps through shared mount adapters:

- **Browse** → `timemap-browser` (`timemap-browser`)
- **Collect** → `collection-manager` (`open-collections-manager`)
- **Present** → `collection-presenter` (`open-collections-presenter`)
- **Account** → `collection-account` (`open-collections-account`)

## Runtime direction

Mounting uses the incremental shared contract from:

- `src/shared/runtime/app-mount-contract.js`
- `src/shared/runtime/host-capabilities.js`
- `src/shared/ui/app-runtime/*`

## Notes

- The shell stays lightweight and does not absorb app-specific business workflows.
- Apps still run standalone from their own app URLs.
