import { backButtonStyles } from '../components/back-button.js';
import { primitiveStyles } from './primitives.css.js';

export const sourceManagerStyles = `
  ${primitiveStyles}

  :host {
    display: grid;
    gap: 0.7rem;
  }

  * {
    box-sizing: border-box;
  }

  .source-manager {
    display: grid;
    gap: 0.7rem;
  }

  .source-list {
    display: grid;
    gap: 0.55rem;
  }

  .source-card {
    border: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    border-radius: var(--oc-radius-control);
    background: var(--oc-bg-panel);
    padding: 0.6rem;
    display: grid;
    gap: 0.45rem;
  }

  .source-card.is-active {
    border-color: #60a5fa;
    box-shadow: 0 0 0 1px #bfdbfe inset;
  }

  .source-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.6rem;
  }

  .source-card-label {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 700;
  }

  .source-card-label,
  .panel-subtext {
    overflow-wrap: anywhere;
  }

  .source-card-actions {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .source-card-actions .btn {
    font-size: 0.78rem;
    padding: 0.25rem 0.45rem;
  }

  .source-card-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .provider-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.7rem;
  }

  .provider-layout.single-column {
    grid-template-columns: minmax(0, 1fr);
  }

  .provider-list {
    display: grid;
    gap: 0.5rem;
    align-content: start;
  }

  .root-actions {
    display: grid;
    gap: 0.75rem;
  }

  .root-actions-heading {
    display: grid;
    gap: 0.25rem;
  }

  .root-actions-title {
    margin: 0;
    font-size: 1rem;
    color: var(--oc-text-primary);
  }


  .provider-card {
    border: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    border-radius: var(--oc-radius-control);
    background: var(--oc-bg-panel);
    padding: 0.72rem;
    min-height: 72px;
    text-align: left;
    display: grid;
    gap: 0.2rem;
    align-content: center;
    cursor: pointer;
  }

  .provider-card-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.45rem;
    align-items: stretch;
  }

  .provider-card-info {
    width: 2rem;
    min-height: 72px;
    padding: 0;
    display: grid;
    place-items: center;
  }

  .provider-card-info .icon {
    width: 0.95rem;
    height: 0.95rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .provider-card-support-note {
    margin-top: -0.25rem;
  }

  .support-dialog {
    max-width: 420px;
  }

  .support-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.25rem 0;
    font-size: 0.8rem;
  }

  .support-table th,
  .support-table td {
    text-align: left;
    padding: 0.3rem 0.4rem;
    border-bottom: var(--oc-border-width-sm) solid var(--oc-border-subtle);
  }

  .provider-card.is-selected {
    border-color: var(--oc-border-accent);
    box-shadow: 0 0 0 1px #66a6e8 inset;
    background: #f5faff;
  }

  .provider-card.is-disabled {
    cursor: not-allowed;
    background: var(--oc-bg-subtle);
    color: var(--oc-text-muted);
    border-color: var(--oc-border-subtle);
  }

  .provider-card-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .provider-config {
    display: grid;
    gap: 0.6rem;
    align-content: start;
    border: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    border-radius: var(--oc-radius-control);
    background: var(--oc-bg-subtle);
    padding: 0.7rem;
  }

  .config-section-title {
    margin: 0;
    font-size: 0.83rem;
    color: var(--oc-text-secondary);
  }

  .panel-subtext {
    margin: 0;
    font-size: 0.83rem;
    color: var(--oc-text-muted);
  }

  .pill {
    font-size: 0.72rem;
    padding: 0.1rem 0.4rem;
  }

  .pill.is-ok {
    color: #166534;
    border-color: #86efac;
    background: #f0fdf4;
  }

  .pill.is-warn {
    color: #9a3412;
    border-color: #fdba74;
    background: #fff7ed;
  }

  .pill.is-muted {
    color: var(--oc-text-muted);
    border-color: var(--oc-border-subtle);
    background: var(--oc-bg-subtle);
  }

  .dialog-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .btn-primary {
    border-color: var(--oc-border-accent);
  }

  .storage-help-btn {
    margin-top: 0.5rem;
  }

  .field-row {
    display: grid;
    gap: 0.25rem;
  }

  .field-row > label {
    font-size: 0.8rem;
    color: var(--oc-text-secondary);
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

  ${backButtonStyles}

  .is-hidden {
    display: none;
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

  @media (max-width: 760px) {
    .provider-card-label-row {
      align-items: flex-start;
      flex-direction: column;
      gap: 0.35rem;
    }

    .dialog-actions {
      width: 100%;
    }

    .dialog-actions .btn {
      flex: 1;
      min-width: 0;
    }
  }
`;
