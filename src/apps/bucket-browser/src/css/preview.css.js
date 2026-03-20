export const previewStyles = `
  :host { display: block; }
  .preview-shell {
    position: fixed;
    inset: auto 1rem 1rem auto;
    width: min(480px, calc(100vw - 2rem));
    opacity: 0;
    pointer-events: none;
    transform: translateY(16px);
    transition: opacity 180ms ease, transform 180ms ease;
  }
  .preview-shell.is-open {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
  .preview-card {
    border: 1px solid #cbd5e1;
    border-radius: 18px;
    background: rgba(255,255,255,0.98);
    box-shadow: 0 18px 44px rgba(15, 23, 42, 0.18);
    overflow: hidden;
  }
  .preview-header {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: start;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
  .preview-header h2 { margin: 0; font-size: 0.95rem; }
  .preview-header p { margin: 0.25rem 0 0; color: #64748b; font-size: 0.82rem; }
  .preview-body { padding: 1rem; display: grid; gap: 1rem; }
  .preview-art {
    min-height: 160px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #dbeafe, #f8fbff);
    color: #1d4ed8;
    font-size: 2.5rem;
    font-weight: 800;
  }
  .preview-meta p, .preview-meta ul { margin: 0; color: #334155; }
  .preview-meta ul { padding-left: 1.1rem; display: grid; gap: 0.25rem; }
  .note { color: #64748b; font-size: 0.82rem; }
  .btn {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    border-radius: 10px;
    padding: 0.45rem 0.65rem;
    font: inherit;
  }
  .empty { color: #64748b; }
`;
