import { themeTokenStyles } from './theme.css.js';

export const primitiveStyles = `
  ${themeTokenStyles}

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

  .btn:hover {
    background: var(--oc-bg-subtle);
  }

  .btn-primary {
    border-color: var(--oc-border-accent);
    background: var(--oc-color-blue-700);
    color: var(--oc-color-white);
  }

  .btn-primary:hover {
    background: var(--oc-color-blue-800);
  }

  .empty {
    border: var(--oc-border-width-sm) dashed var(--oc-border-control);
    background: var(--oc-bg-subtle);
    border-radius: var(--oc-radius-panel);
    color: var(--oc-text-muted);
    text-align: center;
    padding: var(--oc-space-4);
    font-size: 0.9rem;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--oc-space-3) var(--oc-space-4);
    border-bottom: var(--oc-border-width-sm) solid var(--oc-header-border);
    background: var(--oc-header-bg);
  }

  .dialog-header {
    padding: var(--oc-space-3) var(--oc-space-4);
    border-bottom: var(--oc-border-width-sm) solid var(--oc-header-border);
    background: var(--oc-header-bg);
    font-weight: 600;
  }

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
`;
