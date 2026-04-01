import { primitiveStyles } from "./primitives.css.js";

export const browserRendererStyles = `
  ${primitiveStyles}

  :host {
    display: block;
    width: 100%;
    min-height: 0;
  }

  * {
    box-sizing: border-box;
  }

  .asset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    grid-auto-rows: 1fr;
    align-items: stretch;
    align-content: start;
    gap: 0.7rem;
  }

  .asset-card {
    border: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    border-radius: var(--oc-radius-control);
    padding: var(--oc-space-2);
    background: var(--oc-bg-panel);
    display: grid;
    grid-template-rows: auto minmax(2.4rem, auto) auto auto;
    align-content: start;
    gap: 0.5rem;
    height: 100%;
    cursor: pointer;
    transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
    position: relative;
  }

  .asset-card:hover {
    border-color: #93c5fd;
    box-shadow: var(--oc-shadow-card-hover);
    background: #f8fbff;
  }

  .asset-card.is-focused {
    border-color: #0f6cc6;
    box-shadow: 0 0 0 1px #66a6e8 inset, 0 3px 10px rgba(15, 108, 198, 0.16);
    background: #f5faff;
  }

  .asset-card.is-selected:not(.is-focused) {
    border-color: #60a5fa;
    box-shadow: 0 0 0 1px #93c5fd inset;
    background: #f8fbff;
  }

  .selection-toggle {
    position: absolute;
    top: 0.45rem;
    right: 0.45rem;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.4rem;
    border-radius: var(--oc-radius-pill);
    background: rgba(255, 255, 255, 0.92);
    border: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--oc-text-secondary);
  }

  .selection-toggle input {
    margin: 0;
  }

  .thumb-frame {
    width: 100%;
    height: 125px;
    display: block;
    flex-shrink: 0;
    border-radius: var(--oc-radius-control);
    border: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    overflow: hidden;
    background: #eef2f7;
  }

  .thumb {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .thumb-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 0;
    border: var(--oc-border-width-sm) dashed var(--oc-border-control);
    display: grid;
    place-items: center;
    color: var(--oc-text-muted);
    background: var(--oc-bg-subtle);
    font-size: 0.82rem;
  }

  .card-title {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 700;
    line-height: 1.2;
    min-height: 2.1rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .badge {
    font-size: 0.75rem;
    padding: 0.15rem 0.4rem;
    border-radius: var(--oc-radius-pill);
    border: var(--oc-border-width-sm) solid var(--oc-border-control);
    color: var(--oc-text-secondary);
    background: var(--oc-bg-subtle);
  }

  .badge-assignment.is-assigned {
    border-color: #86efac;
    background: #f0fdf4;
    color: #166534;
  }

  .badge-assignment.is-unassigned {
    border-color: #fdba74;
    background: #fff7ed;
    color: #9a3412;
  }

  .card-actions {
    display: flex;
    gap: 0.45rem;
  }

  .card-actions .btn {
    flex: 1;
  }

  .asset-card-mobile-shared {
    grid-template-rows: auto;
    gap: 0;
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
    cursor: pointer;
  }

  .asset-card-mobile-shared .shared-item-card {
    display: block;
  }

  .asset-card-mobile-shared .selection-toggle {
    top: 0.35rem;
    right: 0.35rem;
  }

  .row-table td .btn + .btn {
    margin-left: 0.35rem;
  }

  .empty {
    border-radius: var(--oc-radius-control);
  }

  .row-table-wrap {
    border: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    border-radius: var(--oc-radius-panel);
    overflow-x: auto;
    overflow-y: visible;
    background: var(--oc-bg-panel);
  }

  .row-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.84rem;
  }

  .row-table th,
  .row-table td {
    padding: 0.45rem 0.55rem;
    border-bottom: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    text-align: left;
    vertical-align: middle;
  }

  .row-table tbody tr {
    cursor: pointer;
  }

  .row-table tbody tr:hover {
    background: #f8fbff;
  }

  .row-table tbody tr.is-focused {
    background: #eef6ff;
  }

  .row-table tbody tr.is-selected:not(.is-focused) {
    background: #f8fbff;
  }

  .row-thumb,
  .row-thumb-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    display: block;
    object-fit: cover;
    border: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    background: #eef2f7;
  }

  .row-thumb-placeholder {
    display: grid;
    place-items: center;
    border-style: dashed;
    color: var(--oc-text-muted);
    font-size: 0.6rem;
  }

  @media (max-width: 760px) {
    .asset-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 0.55rem;
    }

    .asset-grid.mobile-shared-cards {
      grid-template-columns: minmax(0, 1fr);
    }

    .asset-card-mobile-shared {
      width: 100%;
      padding: 0;
      gap: 0;
    }

    .thumb-frame {
      height: 108px;
    }

    .row-table {
      font-size: 0.78rem;
    }

    .row-table th,
    .row-table td {
      padding: 0.35rem 0.4rem;
    }
  }
`;
