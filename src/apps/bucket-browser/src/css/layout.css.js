export const layoutStyles = `
  :host { display: block; min-height: 0; }
  .layout {
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(240px, 300px) minmax(0, 1fr) minmax(280px, 340px);
    gap: 1px;
    background: #dbe5f0;
    flex: 1;
  }
  .tree-pane,
  .main-pane,
  .details-pane {
    min-height: 0;
    background: #f8fafc;
  }
  .tree-pane {
    overflow: hidden;
  }
  .main-pane,
  .details-pane {
    overflow: auto;
  }
  @media (max-width: 960px) {
    .layout {
      position: relative;
      grid-template-columns: minmax(0, 1fr);
    }
    .tree-pane,
    .details-pane {
      position: absolute;
      inset: 0;
      z-index: 2;
      background: rgba(248, 250, 252, 0.98);
      transform: translateX(-100%);
      transition: transform 180ms ease;
      overflow: auto;
    }
    .details-pane {
      transform: translateX(100%);
    }
    .layout[data-mobile-tree-open="true"] .tree-pane {
      transform: translateX(0);
    }
    .layout[data-mobile-details-open="true"] .details-pane {
      transform: translateX(0);
    }
  }
`;
