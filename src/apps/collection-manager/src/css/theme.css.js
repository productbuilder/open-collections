import { rawTokenStyles } from './tokens.css.js';

export const themeTokenStyles = `
  ${rawTokenStyles}

  :host {
    --oc-bg-shell: var(--oc-color-slate-100);
    --oc-bg-panel: var(--oc-color-white);
    --oc-bg-subtle: var(--oc-color-slate-50);
    --oc-bg-header: var(--oc-color-white);

    --oc-text-primary: var(--oc-color-slate-900);
    --oc-text-secondary: var(--oc-color-slate-700);
    --oc-text-muted: var(--oc-color-slate-500);

    --oc-border-control: var(--oc-color-slate-300);
    --oc-border-panel: var(--oc-color-slate-200);
    --oc-border-subtle: var(--oc-color-slate-200);
    --oc-border-accent: var(--oc-color-blue-700);

    --oc-radius-control: var(--oc-radius-sm);
    --oc-radius-panel: var(--oc-radius-md);
    --oc-radius-dialog: var(--oc-radius-lg);

    --oc-shadow-dialog: var(--oc-shadow-md);
    --oc-shadow-card-hover: var(--oc-shadow-sm);

    --oc-header-bg: var(--oc-bg-header);
    --oc-header-border: var(--oc-border-panel);
    --oc-header-title: var(--oc-color-gray-900);
    --oc-header-subtitle: var(--oc-text-muted);
  }
`;
