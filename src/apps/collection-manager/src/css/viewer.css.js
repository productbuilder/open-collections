import { primitiveStyles } from './primitives.css.js';

export const viewerStyles = `
  ${primitiveStyles}

  .btn {
    text-decoration: none;
  }

  dialog {
    width: min(980px, 96vw);
    border: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    border-radius: var(--oc-radius-dialog);
    padding: 0;
    box-shadow: var(--oc-shadow-dialog);
    background: var(--oc-bg-panel);
  }

  dialog::backdrop {
    background: rgba(15, 23, 42, 0.45);
  }

  .dialog-shell {
    display: grid;
    grid-template-rows: auto 1fr;
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
  }

  .dialog-title {
    margin: 0;
    font-size: 0.95rem;
  }

  .dialog-body {
    padding: 0.95rem;
    overflow: auto;
    display: grid;
    gap: 0.8rem;
    align-content: start;
  }

  .viewer-media-wrap {
    border: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    border-radius: var(--oc-radius-control);
    background: var(--oc-bg-subtle);
    min-height: 280px;
    max-height: 60vh;
    overflow: auto;
    display: grid;
    place-items: center;
    padding: 0.7rem;
  }

  .viewer-image {
    max-width: 100%;
    max-height: 56vh;
    width: auto;
    height: auto;
    border-radius: 7px;
    border: var(--oc-border-width-sm) solid var(--oc-border-control);
    background: var(--oc-bg-panel);
  }

  .viewer-video {
    max-width: 100%;
    max-height: 56vh;
    border-radius: 7px;
    border: var(--oc-border-width-sm) solid var(--oc-border-control);
    background: #0f172a;
  }

  .viewer-details {
    display: grid;
    gap: 0.55rem;
  }

  .viewer-text {
    margin: 0;
    color: var(--oc-text-secondary);
    font-size: 0.9rem;
    white-space: pre-wrap;
  }

  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .badge {
    font-size: 0.75rem;
    padding: 0.15rem 0.4rem;
    border-radius: 999px;
    border: var(--oc-border-width-sm) solid var(--oc-border-control);
    color: var(--oc-text-secondary);
    background: var(--oc-bg-subtle);
  }

  .badge.ok {
    border-color: #86efac;
    background: #f0fdf4;
    color: #166534;
  }

  .badge.warn {
    border-color: #fed7aa;
    background: #fff7ed;
    color: #9a3412;
  }

  .badge.source-badge {
    border-color: #bfdbfe;
    background: #eff6ff;
    color: #1d4ed8;
  }

  .dialog-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .empty {
    border-radius: 8px;
  }

  .is-hidden {
    display: none;
  }
`;
