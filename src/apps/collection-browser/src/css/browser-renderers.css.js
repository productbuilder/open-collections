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
    border: 1px solid #dbe3ec;
    border-radius: 9px;
    padding: 0.55rem;
    background: #ffffff;
    display: grid;
    grid-template-rows: auto minmax(2.4rem, auto) auto;
    align-content: start;
    gap: 0.5rem;
    height: 100%;
    cursor: pointer;
    transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
  }

  .asset-card:hover {
    border-color: #93c5fd;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    background: #f8fbff;
  }

  .asset-card.is-focused {
    border-color: #0f6cc6;
    box-shadow: 0 0 0 1px #66a6e8 inset, 0 3px 10px rgba(15, 108, 198, 0.16);
    background: #f5faff;
  }

  .thumb-frame {
    width: 100%;
    height: 125px;
    display: block;
    flex-shrink: 0;
    border-radius: 7px;
    border: 1px solid #dbe3ec;
    overflow: hidden;
    background: #eef2f7;
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
    color: #64748b;
    background: #f8fafc;
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
    color: #475569;
    line-height: 1.45;
  }

  .card-actions {
    display: flex;
    gap: 0.45rem;
  }

  .btn {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #0f172a;
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
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    color: #64748b;
    background: #f8fafc;
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
