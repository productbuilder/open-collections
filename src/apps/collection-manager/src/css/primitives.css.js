import { themeTokenStyles } from './theme.css.js';

export const primitiveStyles = `
  ${themeTokenStyles}

  .oc-btn,
  .btn {
    border: var(--oc-border-width-sm) solid var(--oc-border-control);
    background: var(--oc-bg-panel);
    color: var(--oc-text-primary);
    border-radius: var(--oc-radius-control);
    padding: var(--oc-space-2) var(--oc-space-3);
    cursor: pointer;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .oc-btn:hover,
  .btn:hover {
    background: var(--oc-bg-subtle);
  }

  .oc-btn-primary,
  .btn-primary {
    border-color: var(--oc-border-accent);
    background: var(--oc-color-blue-700);
    color: var(--oc-color-white);
  }

  .oc-btn-primary:hover,
  .btn-primary:hover {
    background: #0d5eae;
  }

  .oc-btn-ghost {
    background: transparent;
  }

  .oc-empty,
  .empty {
    border: 1px dashed var(--oc-border-control);
    background: var(--oc-bg-subtle);
    border-radius: var(--oc-radius-panel);
    color: var(--oc-text-muted);
    text-align: center;
    padding: var(--oc-space-4);
    font-size: 0.9rem;
  }

  .oc-panel-header,
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--oc-space-3) var(--oc-space-4);
    border-bottom: var(--oc-border-width-sm) solid var(--oc-header-border);
    background: var(--oc-header-bg);
  }

  .oc-dialog-header,
  .dialog-header {
    padding: var(--oc-space-3) var(--oc-space-4);
    border-bottom: var(--oc-border-width-sm) solid var(--oc-header-border);
    background: var(--oc-header-bg);
    font-weight: 600;
  }

  .oc-chip,
  .pill {
    display: inline-flex;
    align-items: center;
    border-radius: var(--oc-radius-pill);
    padding: 0 var(--oc-space-2);
    background: var(--oc-bg-subtle);
    color: var(--oc-text-secondary);
    font-size: 0.85em;
    border: var(--oc-border-width-sm) solid var(--oc-border-control);
    line-height: 1.6;
  }

  .oc-icon-btn,
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

  .oc-icon-btn:hover,
  .icon-btn:hover {
    background: var(--oc-bg-subtle);
    color: var(--oc-text-primary);
  }
`;
