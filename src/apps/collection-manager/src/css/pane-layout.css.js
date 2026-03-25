import { themeTokenStyles } from './theme.css.js';

export const paneLayoutStyles = `
  ${themeTokenStyles}

  :host {
    display: block;
    flex: 1;
    min-height: 0;
    --oc-pane-divider: var(--oc-border-width-sm) solid var(--oc-border-panel);
  }

  * {
    box-sizing: border-box;
  }

  .pane-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 420px;
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }

  .pane-main,
  .pane-inspector {
    min-height: 0;
    overflow: hidden;
  }

  .pane-layout[data-inspector-placement="right"] .pane-inspector {
    border-left: var(--oc-pane-divider);
  }

  .pane-layout[data-inspector-placement="bottom"] {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) 320px;
  }

  .pane-layout[data-inspector-placement="bottom"] .pane-inspector {
    border-top: var(--oc-pane-divider);
  }

  .pane-layout[data-inspector-placement="hidden"] {
    grid-template-columns: minmax(0, 1fr);
  }

  .pane-layout[data-inspector-placement="hidden"] .pane-inspector {
    display: none;
  }

  @media (max-width: 1080px) {
    .pane-layout[data-inspector-placement="right"] {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
    }

    .pane-layout[data-inspector-placement="right"] .pane-inspector {
      border-left: 0;
      border-top: var(--oc-pane-divider);
    }
  }

  @media (max-width: 760px) {
    .pane-layout {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr);
      overflow: hidden;
    }
  }
`;
