export const appFoundationTokenStyles = `
  :host {
    color-scheme: light;

    /* Core colors */
    --oc-color-white: #ffffff;
    --oc-color-slate-50: #f8fafc;
    --oc-color-slate-100: #f3f5f8;
    --oc-color-slate-200: #e2e8f0;
    --oc-color-slate-300: #cbd5e1;
    --oc-color-slate-500: #64748b;
    --oc-color-slate-600: #475569;
    --oc-color-slate-900: #0f172a;
    --oc-color-blue-700: #0f6cc6;
    --oc-color-blue-800: #0f4f8a;

    --oc-color-brown-700: #8d8a88;

    /* Shared spacing + radius */
    --oc-space-1: 0.25rem;
    --oc-space-2: 0.5rem;
    --oc-space-3: 0.75rem;
    --oc-space-4: 1rem;
    --oc-space-5: 1.25rem;
    --oc-space-6: 1.5rem;

    --oc-radius-sm: 8px;
    --oc-radius-md: 10px;
    --oc-radius-lg: 12px;

    /* Layout sizing */
    --oc-layout-content-max: 1100px;
    --oc-layout-panel-max: 720px;
    --oc-layout-nav-height: 64px;
    --oc-layout-mobile-nav-height: 72px;
    --oc-layout-safe-top: env(safe-area-inset-top, 0px);
    --oc-layout-safe-right: env(safe-area-inset-right, 0px);
    --oc-layout-safe-bottom: env(safe-area-inset-bottom, 0px);
    --oc-layout-safe-left: env(safe-area-inset-left, 0px);

    /* App foundation semantic tokens */
    --oc-bg-canvas: var(--oc-color-slate-100);
    --oc-bg-surface: var(--oc-color-white);
    --oc-bg-subtle: var(--oc-color-slate-50);

    --oc-text-primary: var(--oc-color-slate-900);
    --oc-text-muted: var(--oc-color-slate-500);

    --oc-border-default: var(--oc-color-slate-200);
    --oc-border-strong: var(--oc-color-slate-300);
    --oc-border-accent: var(--oc-color-brown-700);

    /* Backward-compatible aliases for manager/account usage */
    --oc-bg-panel: var(--oc-bg-surface);
    --oc-border-panel: var(--oc-border-default);
    --oc-border-subtle: var(--oc-border-default);
    --oc-border-control: var(--oc-border-strong);
    --oc-radius-panel: var(--oc-radius-md);
    --oc-radius-control: var(--oc-radius-sm);
    --oc-border-width-sm: 1px;
    --oc-header-title: var(--oc-text-primary);
  }
`;
