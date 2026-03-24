import { themeTokenStyles } from './theme.css.js';
import { primitiveStyles } from './primitives.css.js';

export const metadataStyles = `
  ${themeTokenStyles}
  ${primitiveStyles}

  :host {
    display: block;
    min-height: 0;
    height: 100%;
  }

  [hidden] {
    display: none !important;
  }

  * {
    box-sizing: border-box;
  }

  .editor-panel {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: var(--oc-bg-panel);
    border-left: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    border-radius: 0;
    box-shadow: none;
  }

  .editor-panel[data-presentation="embedded"] {
    border: 1px solid #dbe3ec;
    border-radius: 14px;
    overflow: hidden;
  }

  .editor-panel[data-presentation="embedded"] .editor-content {
    overflow: visible;
  }

  .editor-panel[data-presentation="embedded"] .editor-wrap {
    padding: 0.85rem;
  }

  .panel-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.7rem;
  }

  .panel-title {
    margin: 0;
    font-size: 0.95rem;
    color: var(--oc-header-title);
  }

  .editor-header-meta {
    display: grid;
    gap: 0.15rem;
    align-content: start;
    min-width: 0;
  }

  .editor-context {
    margin: 0;
    font-size: 0.78rem;
    color: var(--oc-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .editor-header-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
  }

  .editor-content {
    min-height: 0;
    overflow: auto;
  }

  .editor-wrap {
    padding: 0.95rem;
    display: grid;
    gap: 0.6rem;
    align-content: start;
    min-height: 0;
  }

  .field-row {
    display: grid;
    gap: 0.25rem;
  }

  .field-row > label {
    font-size: 0.8rem;
    color: var(--oc-color-slate-600);
    font-weight: 600;
  }

  input,
  textarea {
    width: 100%;
    font: inherit;
    font-size: 0.9rem;
    border: var(--oc-border-width-sm) solid var(--oc-border-control);
    border-radius: var(--oc-radius-control);
    padding: 0.45rem 0.55rem;
    background: var(--oc-bg-panel);
    color: var(--oc-text-primary);
  }

  textarea {
    resize: vertical;
    min-height: 78px;
  }

  .checkbox-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.84rem;
    color: #334155;
    padding-top: 0.2rem;
  }

  .checkbox-row input {
    width: auto;
  }

  .btn-primary {
    background: var(--oc-color-blue-700);
    color: var(--oc-color-white);
    border-color: var(--oc-border-accent);
  }

  .btn-primary:hover {
    background: #0d5eae;
  }

  .btn-danger {
    background: #dc2626;
    color: #ffffff;
    border-color: #dc2626;
  }

  .btn-danger:hover {
    background: #b91c1c;
  }

  .btn-secondary {
    color: #0f6cc6;
    border-color: #bfdbfe;
    background: #eff6ff;
  }

  .btn-secondary:hover {
    background: #dbeafe;
  }

  .editor-section {
    border-top: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    padding-top: 0.6rem;
    display: grid;
    gap: 0.45rem;
  }

  .editor-section-title {
    margin: 0;
    font-size: 0.78rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--oc-text-muted);
    font-weight: 700;
  }

  .section-help,
  .field-help {
    margin: 0;
    font-size: 0.78rem;
    color: var(--oc-text-muted);
    line-height: 1.4;
  }

  .override-field {
    padding: 0.75rem;
    border: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    border-radius: var(--oc-radius-panel);
    background: var(--oc-bg-subtle);
  }

  .override-field.is-override-active {
    background: #ffffff;
    border-color: #bfdbfe;
    box-shadow: inset 0 0 0 1px rgba(15, 108, 198, 0.08);
  }

  .override-row-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
  }

  .override-row-header label {
    font-size: 0.8rem;
    color: #475569;
    font-weight: 600;
  }

  .inheritance-preview {
    border: var(--oc-border-width-sm) dashed var(--oc-border-control);
    border-radius: var(--oc-radius-control);
    background: var(--oc-bg-panel);
    color: var(--oc-text-secondary);
    font-size: 0.85rem;
    line-height: 1.4;
    padding: 0.65rem 0.75rem;
    white-space: pre-wrap;
  }

  .empty {
    border-radius: var(--oc-radius-control);
  }

  .editor-close-btn {
    display: none;
  }

  @media (max-width: 760px) {
    :host {
      height: auto;
    }

    .editor-panel:not([data-presentation="embedded"]) {
      position: fixed;
      inset: 0;
      z-index: 12;
      border: none;
      border-radius: 0;
      box-shadow: none;
      background: var(--oc-bg-shell);
      display: none;
    }

    .editor-panel.is-mobile-editor-open:not([data-presentation="embedded"]) {
      display: grid;
    }

    .editor-panel[data-presentation="embedded"] {
      border: none;
      border-radius: 0;
      background: transparent;
    }

    .panel-header {
      padding: 0.7rem 0.8rem;
      position: sticky;
      top: 0;
      z-index: 2;
    }

    .editor-context {
      max-width: 160px;
    }

    .editor-wrap {
      padding: 0.8rem;
    }

    .override-row-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .editor-close-btn {
      display: inline-flex;
    }

    .btn,
    .oc-btn {
      padding: 0.3rem 0.52rem;
      font-size: 0.77rem;
      border-radius: 7px;
    }
  }
`;
