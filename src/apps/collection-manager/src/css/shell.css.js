import { themeTokenStyles } from './theme.css.js';

export const shellStyles = `
  ${themeTokenStyles}

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

  #paneLayout {
    flex: 1;
    min-height: 0;
  }

  #mobileFlow {
    display: none;
    flex: 1;
    min-height: 0;
  }

  .btn {
    border: var(--oc-border-width-sm) solid var(--oc-border-control);
    background: var(--oc-bg-panel);
    color: var(--oc-text-primary);
    border-radius: var(--oc-radius-control);
    padding: 0.42rem 0.7rem;
    cursor: pointer;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .btn:hover {
    background: var(--oc-bg-subtle);
  }

  .btn-primary {
    background: var(--oc-color-blue-700);
    color: var(--oc-color-white);
    border-color: var(--oc-border-accent);
  }

  .btn-primary:hover {
    background: #0d5eae;
  }

  .panel-subtext {
    margin: 0;
    font-size: 0.83rem;
    color: var(--oc-text-muted);
  }

  .empty {
    border: var(--oc-border-width-sm) dashed var(--oc-border-control);
    border-radius: var(--oc-radius-control);
    padding: 1rem;
    text-align: center;
    color: var(--oc-text-muted);
    background: var(--oc-bg-subtle);
    font-size: 0.9rem;
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

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    padding: 0.8rem 0.95rem;
    border-bottom: var(--oc-border-width-sm) solid var(--oc-border-subtle);
  }

  .dialog-title {
    margin: 0;
    font-size: 0.95rem;
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

  .icon-btn {
    border: 0;
    background: transparent;
    color: var(--oc-color-slate-600);
    border-radius: var(--oc-radius-pill);
    width: 2.25rem;
    height: 2.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }

  .icon-btn:hover {
    background: var(--oc-bg-subtle);
    color: var(--oc-text-primary);
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
    border: 1px solid #dbe3ec;
    border-radius: 12px;
    background: #ffffff;
    padding: 0.75rem;
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
    color: #0f172a;
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
    border: 1px solid #dbe3ec;
    border-radius: 8px;
    background: #ffffff;
    padding: 0.75rem;
    display: grid;
    gap: 0.45rem;
  }

  .storage-heading {
    margin: 0;
    font-size: 0.9rem;
    color: #0f172a;
  }

  .storage-list {
    margin: 0;
    padding-left: 1.1rem;
    display: grid;
    gap: 0.3rem;
    color: #334155;
    font-size: 0.86rem;
  }

  .storage-table-wrap {
    overflow: auto;
    border: 1px solid #dbe3ec;
    border-radius: 8px;
    background: #ffffff;
  }

  .storage-table {
    width: 100%;
    min-width: 980px;
    border-collapse: collapse;
    font-size: 0.82rem;
    color: #334155;
  }

  .storage-table th,
  .storage-table td {
    border-bottom: 1px solid #e2e8f0;
    padding: 0.45rem 0.5rem;
    text-align: left;
    vertical-align: top;
  }

  .storage-table th {
    background: #f8fafc;
    color: #0f172a;
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
    border-radius: 999px;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 0.72rem;
    font-weight: 700;
    white-space: nowrap;
  }

  pre {
    margin: 0;
    padding: 0.75rem;
    border-radius: 8px;
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
    .dialog-header {
      padding: 0.75rem 0.8rem;
    }

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

    .btn {
      padding: 0.3rem 0.52rem;
      font-size: 0.77rem;
      border-radius: 7px;
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
