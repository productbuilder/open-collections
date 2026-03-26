import { primitiveStyles } from './primitives.css.js';

export const shellStyles = `
  ${primitiveStyles}

  :host {
    display: block;
    color: var(--oc-header-title);
    font-family: "Segoe UI", Tahoma, sans-serif;
    height: 100%;
    min-height: 0;
  }

  * {
    box-sizing: border-box;
  }

  [hidden] {
    display: none !important;
  }

  .app-shell {
    height: min(100dvh, 100vh);
    min-height: 640px;
    background: var(--oc-bg-shell);
    border: var(--oc-border-width-sm) solid var(--oc-border-panel);
    border-radius: var(--oc-radius-panel);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  :host([data-workbench-embed]) .app-shell {
    height: 100%;
    min-height: 0;
    border: 0;
    border-radius: 0;
  }

  :host([data-mobile-shell]) .app-shell {
    min-height: 0;
    height: 100dvh;
    border: 0;
    border-radius: 0;
  }

  #paneLayout {
    flex: 1;
    min-height: 0;
  }

  #mobileFlow {
    display: none;
    flex: 1;
    min-height: 0;
  }

  :host([data-mobile-shell]) #paneLayout {
    display: none;
  }

  :host([data-mobile-shell]) #mobileFlow {
    display: block;
  }


  .panel-subtext {
    margin: 0;
    font-size: 0.83rem;
    color: var(--oc-text-muted);
  }

  .empty {
    border-radius: var(--oc-radius-control);
  }

  .is-hidden {
    display: none;
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
  textarea,
  select {
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

  dialog {
    width: min(760px, 94vw);
    border: var(--oc-border-width-sm) solid var(--oc-border-panel);
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
    max-height: min(84vh, 760px);
  }

  .host-dialog {
    width: min(760px, 94vw);
  }

  .dialog-shell > .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
  }

  .dialog-title {
    margin: 0;
    font-size: 0.95rem;
    color: var(--oc-header-title);
  }

  .connections-dialog-header {
    gap: 0.9rem;
  }

  .connections-dialog-heading {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }

  .dialog-nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    align-self: flex-start;
  }

  .add-connection-view {
    gap: 0.9rem;
  }

  .add-connection-view-header {
    display: grid;
    gap: 0.55rem;
    align-content: start;
  }

  .add-connection-view-title {
    margin: 0;
    font-size: 1rem;
    color: var(--oc-text-primary);
  }

  .dialog-body {
    padding: 0.95rem;
    overflow: auto;
    display: grid;
    gap: 0.7rem;
    align-content: start;
  }

  .dialog-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .dialog-panels {
    padding: 0;
    display: block;
  }

  .dialog-panel {
    padding: 0.95rem;
  }

  .dialog-actions .btn {
    min-width: 0;
  }

  .source-card {
    border: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    border-radius: 12px;
    background: var(--oc-bg-panel);
    padding: var(--oc-space-3);
    display: grid;
    gap: 0.55rem;
    cursor: pointer;
    transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
  }

  .source-card:hover {
    border-color: #bfdbfe;
  }

  .source-card:focus-visible {
    outline: 2px solid #60a5fa;
    outline-offset: 2px;
  }

  .source-card-label {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 700;
  }

  .source-list {
    display: grid;
    gap: 0.55rem;
  }

  .source-card.is-active-source {
    border-color: #0f6cc6;
    box-shadow: 0 0 0 1px #66a6e8 inset;
    background: #f5faff;
  }

  .source-card-add {
    border-style: dashed;
    background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  }

  .source-card-add:hover {
    border-color: #60a5fa;
    background: #f8fbff;
  }


  .source-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.6rem;
  }

  .source-card-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
    min-width: 0;
  }

  .source-card-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--oc-text-primary);
    overflow-wrap: anywhere;
  }

  .source-card-location {
    margin: 0;
    font-size: 0.8rem;
    color: #64748b;
    overflow-wrap: anywhere;
  }

  .source-card-actions {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .source-card-actions .btn {
    min-width: 0;
  }

  .source-card-remove {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .source-card-active-pill {
    align-self: flex-start;
  }

  .icon {
    width: 0.95rem;
    height: 0.95rem;
    display: inline-flex;
    flex: 0 0 auto;
  }

  .icon-trash {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.35;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .icon-close {
    fill: currentColor;
  }

  .storage-dialog {
    width: min(1080px, 96vw);
  }

  .storage-layout {
    display: grid;
    gap: 0.8rem;
  }

  .storage-section {
    border: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    border-radius: var(--oc-radius-control);
    background: var(--oc-bg-panel);
    padding: var(--oc-space-3);
    display: grid;
    gap: 0.45rem;
  }

  .storage-heading {
    margin: 0;
    font-size: 0.9rem;
    color: var(--oc-text-primary);
  }

  .storage-list {
    margin: 0;
    padding-left: 1.1rem;
    display: grid;
    gap: 0.3rem;
    color: var(--oc-text-secondary);
    font-size: 0.86rem;
  }

  .storage-table-wrap {
    overflow: auto;
    border: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    border-radius: var(--oc-radius-control);
    background: var(--oc-bg-panel);
  }

  .storage-table {
    width: 100%;
    min-width: 980px;
    border-collapse: collapse;
    font-size: 0.82rem;
    color: var(--oc-text-secondary);
  }

  .storage-table th,
  .storage-table td {
    border-bottom: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    padding: 0.45rem 0.5rem;
    text-align: left;
    vertical-align: top;
  }

  .storage-table th {
    background: var(--oc-bg-subtle);
    color: var(--oc-text-primary);
    font-weight: 700;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .storage-table tr:last-child td {
    border-bottom: none;
  }

  .storage-tag {
    display: inline-block;
    padding: 0.08rem 0.38rem;
    border-radius: var(--oc-radius-pill);
    border: var(--oc-border-width-sm) solid var(--oc-color-blue-200);
    background: var(--oc-color-blue-50);
    color: #1d4ed8;
    font-size: 0.72rem;
    font-weight: 700;
    white-space: nowrap;
  }

  pre {
    margin: 0;
    padding: var(--oc-space-3);
    border-radius: var(--oc-radius-control);
    background: #0f172a;
    color: #dbeafe;
    font-size: 0.8rem;
    max-height: 280px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }

  @media (max-width: 1080px) {
    #paneLayout {
      overflow: auto;
    }
  }

  @media (max-width: 760px) {

    .dialog-body {
      padding: 0.8rem;
    }

    .dialog-panel {
      padding: 0.8rem;
    }

    .app-shell {
      border: none;
      border-radius: 0;
      min-height: 100dvh;
    }


    .dialog-actions .btn {
      flex: 1 1 calc(50% - 0.5rem);
    }

    .source-card {
      padding: 0.65rem;
    }

    .connections-dialog-heading {
      width: 100%;
      align-items: center;
    }

    .source-card-header {
      flex-direction: column;
      align-items: stretch;
    }

    .source-card-active-pill {
      align-self: flex-start;
    }

    dialog,
    .host-dialog {
      width: min(94vw, 680px);
      margin: auto;
    }

    .dialog-shell {
      max-height: min(86vh, 720px);
    }

    .dialog-body {
      overflow-y: auto;
    }
  }

  @media (max-width: 760px) {
    .app-shell {
      min-height: 0;
      border: 0;
      border-radius: 0;
    }

    #paneLayout {
      display: none;
    }

    #mobileFlow {
      display: block;
    }
  }
`;
