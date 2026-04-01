import { appFoundationLayoutStyles } from "../../../../shared/ui/app-foundation/layout.css.js";
import { appRuntimeStyles } from "../../../../shared/ui/app-runtime/styles.css.js";

export const appShellStyles = `
  ${appFoundationLayoutStyles}
  ${appRuntimeStyles}

  :host {
    display: block;
    width: 100%;
    height: 100dvh;
    min-height: 100dvh;
    overflow: hidden;
  }

  .oc-app-frame {
    display: flex;
    flex-direction: column;
	height: 100%;
    min-height: 0;
    background: var(--oc-bg-canvas);
    color: var(--oc-text-primary);
    overflow: hidden;
  }

  .oc-app-bar {
	flex: 0 0 auto;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.75rem;
    padding: var(--oc-space-3) var(--oc-space-4);
    border-bottom: var(--oc-border-width-sm) solid var(--oc-border-default);
    background: var(--oc-bg-surface);
  }

  .oc-app-bar__title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
  }

  .shell-nav {
	width:100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

.shell-nav--primary {
  display: flex;
  justify-content: center;
  justify-self: center;
  gap: 1rem;
}

.shell-nav--account {
  justify-self: end;
}

  .shell-nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    border: var(--oc-border-width-sm) solid var(--oc-border-strong);
    border-radius: var(--oc-radius-sm);
    background: var(--oc-bg-surface);
    color: var(--oc-text-primary);
    font: inherit;
    font-size: 0.84rem;
    font-weight: 600;
    padding: 0.45rem 0.55rem;
    cursor: pointer;
    white-space: nowrap;
    touch-action: manipulation;
  }

  .shell-nav-icon {
    width: 1rem;
    height: 1rem;
    display: block;
    flex-shrink: 0;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.9;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .shell-nav-label {
    line-height: 1;
  }

  .shell-nav-btn:focus-visible {
    outline: 2px solid var(--oc-border-accent);
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .shell-nav-btn:hover {
      border-color: #b6c4d2;
      background: #f8fbff;
    }
  }

  .shell-nav-btn[aria-current="page"] {
    border-color: var(--oc-border-accent);
    background: var(--oc-border-accent);
    color: var(--oc-color-white);
  }

  .oc-app-viewport {
    flex: 1 1 auto;
    min-height: 0;
	height: 100%;
	display: flex;
	overflow: hidden;
  }

.shell-section-mount {
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
  width: 100%;
  display: flex;
  overflow: hidden;
}

.shell-section-mount[hidden] {
  display: none !important;
}

.shell-section-mount > * {
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
  width: 100%;
}

@media (max-width: 760px) {
  .oc-app-frame {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
  }

  .oc-app-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;

    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: stretch;
    gap: 0.35rem;

    padding:
      0.4rem
      calc(0.6rem + env(safe-area-inset-right))
      calc(0.45rem + env(safe-area-inset-bottom))
      calc(0.6rem + env(safe-area-inset-left));

    border-top: var(--oc-border-width-sm) solid var(--oc-border-default);
    border-bottom: 0;
    background: var(--oc-bg-surface);
  }

  .oc-app-bar__title {
    display: none;
  }

  .shell-nav--primary,
  .shell-nav--account {
    display: contents;
  }

  .shell-nav-btn {
    width: 100%;
    min-width: 0;
    min-height: 3.2rem;

    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;

    padding: 0.3rem 0.2rem;
    border: 0;
    border-radius: var(--oc-radius-md);
    font-size: 0.7rem;
    font-weight: 600;
    -webkit-tap-highlight-color: transparent;
  }

  .shell-nav-btn[aria-current="page"] {
    background: #e9f2ff;
    color: var(--oc-border-accent);
  }

  .shell-nav--account .shell-nav-label {
    display: inline;
  }

  .oc-app-viewport {
    flex: 1 1 auto;
    <!-- padding-bottom: calc(4.5rem + var(--oc-space-3) + env(safe-area-inset-bottom)); -->
  }
}

  @media (min-width: 761px) {
    .oc-app-bar {
      grid-template-columns: auto 1fr auto;
    }

    .shell-nav--primary {
      justify-self: start;
    }

    .shell-nav--account {
      justify-self: end;
    }
  }
`;
