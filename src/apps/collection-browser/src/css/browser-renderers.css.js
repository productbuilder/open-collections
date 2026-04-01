export const browserRendererStyles = `
  :host {
    display: block;
  }

  * {
    box-sizing: border-box;
  }

  .asset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    grid-auto-rows: 1fr;
    align-items: stretch;
    align-content: start;
    gap: 0.7rem;
  }

  .asset-card {
    border: 1px solid var(--oc-browser-border, #d9d5d0);
    border-radius: 9px;
    padding: 0.55rem;
    background: var(--oc-browser-bg-card, #fffdfa);
    display: grid;
    grid-template-rows: auto minmax(2.4rem, auto) auto;
    align-content: start;
    gap: 0.5rem;
    height: 100%;
    cursor: pointer;
    transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
  }

  .asset-card:hover {
    border-color: var(--oc-browser-border-strong, #c8c1b8);
    box-shadow: 0 1px 3px rgba(46, 41, 36, 0.08);
    background: var(--oc-browser-bg-card-soft, #f8f3ed);
  }

  .asset-card.is-focused {
    border-color: var(--oc-browser-accent, #756c64);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--oc-browser-accent, #756c64) 44%, #ffffff 56%) inset, 0 3px 10px rgba(77, 64, 50, 0.16);
    background: var(--oc-browser-accent-soft, #ece7e1);
  }

  .thumb-frame {
    width: 100%;
    height: 125px;
    display: block;
    flex-shrink: 0;
    border-radius: 7px;
    border: 1px solid var(--oc-browser-border, #d9d5d0);
    overflow: hidden;
    background: var(--oc-browser-surface-muted, #eee5dc);
  }

  .thumb {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .thumb-placeholder {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: var(--oc-browser-text-muted, #6c6258);
    background: var(--oc-browser-placeholder-fill, #e8e4de);
    font-size: 0.82rem;
  }

  .card-title {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 700;
    line-height: 1.2;
    min-height: 2.1rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .meta {
    margin: 0;
    font-size: 0.82rem;
    color: var(--oc-browser-text-muted, #6c6258);
    line-height: 1.45;
  }

  .card-actions {
    display: flex;
    gap: 0.45rem;
  }

  .btn {
    border: 1px solid var(--oc-browser-border, #d9d5d0);
    background: var(--oc-browser-bg-card, #fffdfa);
    color: var(--oc-browser-text, #2e2924);
    border-radius: 8px;
    padding: 0.42rem 0.7rem;
    cursor: pointer;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .card-actions .btn {
    flex: 1;
  }

  .empty {
    border: 1px solid var(--oc-browser-border, #d9d5d0);
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    color: var(--oc-browser-text-muted, #6c6258);
    background: var(--oc-browser-surface-muted, #eee5dc);
    font-size: 0.9rem;
  }

  @media (max-width: 760px) {
    .asset-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 0.55rem;
    }

    .thumb-frame {
      height: 108px;
    }
  }
`;
