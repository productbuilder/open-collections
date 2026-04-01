import { appFoundationLayoutStyles } from "../../../../shared/ui/app-foundation/layout.css.js";

export const presenterShellStyles = `
  ${appFoundationLayoutStyles}

  :host {
    display: block;
    height: 100%;
    min-height: 100vh;
  }

  :host([data-workbench-embed]),
  :host([data-shell-embed]),
  :host([data-oc-app-mode="embedded"]) {
    min-height: 100%;
  }

  .oc-app-viewport {
    min-height: 100%;
    padding: 0 var(--oc-space-4) var(--oc-space-3);
  }

  .presenter-panel-wrap {
    min-height: 0;
    flex: 1 1 auto;
  }

  .toolbar-actions {
    display: flex;
    gap: var(--oc-space-2);
  }

  .presenter-grid-wrap {
    display: block;
    height: 100%;
    overflow: auto;
    padding: 0 0 var(--oc-space-1);
  }

  #presenterGrid {
    display: block;
  }

  .presenter-cell {
    display: block;
    min-width: 0;
  }

  .presenter-card {
    border: 1px solid var(--oc-border-muted);
    border-radius: var(--oc-radius-md);
    background: var(--oc-bg-surface);
    display: grid;
    gap: var(--oc-space-2);
    padding: var(--oc-space-2);
  }

  .presenter-card-open {
    appearance: none;
    border: 0;
    background: transparent;
    padding: 0;
    margin: 0;
    width: 100%;
    text-align: left;
    display: grid;
    gap: var(--oc-space-2);
    cursor: pointer;
  }

  .presenter-card-preview {
    width: 100%;
    aspect-ratio: 16 / 10;
    border-radius: var(--oc-radius-sm);
    border: 1px solid var(--oc-border-muted);
    background: var(--oc-bg-subtle);
    overflow: hidden;
    display: grid;
    place-items: center;
  }

  .presenter-card-preview img,
  .presenter-card-placeholder {
    width: 100%;
    height: 100%;
    display: block;
  }

  .presenter-card-preview img {
    object-fit: cover;
  }

  .presenter-card-placeholder {
    background: linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%);
  }

  .presenter-card-meta {
    display: grid;
    gap: 0.3rem;
  }

  .presenter-card-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--oc-text-primary);
  }

  .presenter-card-badge {
    display: inline-flex;
    width: fit-content;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--oc-text-muted);
    border: 1px solid var(--oc-border-muted);
    border-radius: 999px;
    padding: 0.1rem 0.45rem;
  }

  .presenter-card-summary {
    margin: 0;
    font-size: 0.8rem;
    color: var(--oc-text-muted);
  }

  .presenter-card-actions {
    display: flex;
    justify-content: flex-end;
  }

  .presenter-edit-btn {
    font-size: 0.78rem;
    padding: 0.3rem 0.55rem;
  }

  .btn {
    appearance: none;
    border: 1px solid var(--oc-border-control);
    background: var(--oc-bg-surface);
    color: var(--oc-text-primary);
    border-radius: var(--oc-radius-md);
    padding: 0.45rem 0.7rem;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }

  .btn:hover {
    background: var(--oc-bg-subtle);
  }

  .presenter-empty {
    display: block;
  }

  .presenter-dialog {
    border: 1px solid var(--oc-border-muted);
    border-radius: var(--oc-radius-lg);
    padding: var(--oc-space-4);
    width: min(42rem, calc(100vw - 2rem));
    background: var(--oc-bg-surface);
    color: var(--oc-text-primary);
  }

  .presenter-dialog::backdrop {
    background: rgba(0, 0, 0, 0.45);
  }

  .flow-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--oc-space-2);
    margin-bottom: var(--oc-space-3);
  }

  .flow-head h2 {
    margin: 0;
    font-size: 1.05rem;
  }

  .btn-quiet {
    background: transparent;
  }

  @media (max-width: 760px) {
    .oc-app-viewport {
      padding:
        0 var(--oc-space-3)
        calc(var(--oc-space-3) + var(--oc-layout-safe-bottom));
    }
  }

  .flow-template-card {
    border: 1px solid var(--oc-border-muted);
    border-radius: var(--oc-radius-md);
    padding: var(--oc-space-3);
    display: grid;
    gap: var(--oc-space-2);
  }

  .flow-template-card h3,
  .flow-template-card p {
    margin: 0;
  }

  .flow-step-label {
    margin: 0 0 var(--oc-space-3);
    color: var(--oc-text-muted);
    font-size: 0.82rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .flow-field {
    display: grid;
    gap: var(--oc-space-1);
    margin-bottom: var(--oc-space-2);
    font-size: 0.9rem;
  }

  .flow-field input,
  .flow-field select {
    border: 1px solid var(--oc-border-control);
    border-radius: var(--oc-radius-sm);
    padding: 0.45rem 0.5rem;
    background: var(--oc-bg-surface);
    color: var(--oc-text-primary);
    font: inherit;
  }

  .flow-check {
    display: flex;
    align-items: center;
    gap: var(--oc-space-1);
    font-size: 0.85rem;
    margin: var(--oc-space-2) 0;
  }

  .flow-help {
    margin: 0;
    color: var(--oc-text-muted);
    font-size: 0.8rem;
  }

  .flow-review-list {
    margin: 0;
    padding-left: 1rem;
    display: grid;
    gap: var(--oc-space-1);
    font-size: 0.9rem;
  }

  .flow-actions {
    margin-top: var(--oc-space-3);
    display: flex;
    justify-content: flex-end;
    gap: var(--oc-space-2);
  }

  .flow-error {
    margin: var(--oc-space-2) 0 0;
    color: var(--oc-text-danger, #b42318);
    font-size: 0.82rem;
    font-weight: 600;
  }
`;
