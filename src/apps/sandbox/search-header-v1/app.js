const state = {
  viewMode: 'list',
  searchExpanded: false,
  query: '',
  activeFilterCount: 0
};

const appRoot = document.getElementById('app');

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const getViewToggleLabel = () => (state.viewMode === 'list' ? 'Map' : 'List');

const getPreviewSummary = () => {
  const queryLabel = state.query.trim() ? `for “${state.query.trim()}”` : 'with no query';
  const filterLabel =
    state.activeFilterCount > 0
      ? `${state.activeFilterCount} active filter${state.activeFilterCount > 1 ? 's' : ''}`
      : 'no active filters';

  return `${state.viewMode === 'list' ? 'List' : 'Map'} view ${queryLabel}, ${filterLabel}.`;
};

const render = () => {
  const isExpanded = state.searchExpanded;
  const hasFilters = state.activeFilterCount > 0;

  appRoot.innerHTML = `
    <main class="shell">
      <h1 class="title">Open Collections · Search Header v1</h1>
      <p class="subtitle">Mobile-first sandbox for search, filters, and map/list switching.</p>

      <section class="header-card">
        <div class="header-grid${isExpanded ? ' expanded' : ''}">
          <div class="search-row">
            ${
              isExpanded
                ? `<button type="button" class="icon-btn" data-action="collapse-search" aria-label="Collapse search">←</button>`
                : ''
            }
            <label class="search-wrap" aria-label="Search collections">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="2"></circle>
                <path d="M16 16 L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              </svg>
              <input
                class="search-input"
                data-role="search-input"
                type="search"
                placeholder="Search collections"
                value="${escapeHtml(state.query)}"
              />
            </label>
          </div>

          <div class="action-row">
            <button
              type="button"
              class="action-btn${hasFilters ? ' active' : ''}"
              data-action="toggle-filters"
              aria-pressed="${String(hasFilters)}"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                <circle cx="9" cy="7" r="2" stroke="currentColor" stroke-width="2"></circle>
                <path d="M4 12h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                <circle cx="15" cy="12" r="2" stroke="currentColor" stroke-width="2"></circle>
                <path d="M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                <circle cx="11" cy="17" r="2" stroke="currentColor" stroke-width="2"></circle>
              </svg>
              <span>Filters</span>
              ${hasFilters ? `<span class="badge">${state.activeFilterCount}</span>` : ''}
            </button>

            <button type="button" class="action-btn" data-action="toggle-view">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 6h16v12H4z" stroke="currentColor" stroke-width="2" rx="1"></path>
                <path d="M12 6v12" stroke="currentColor" stroke-width="2"></path>
              </svg>
              <span>${getViewToggleLabel()}</span>
            </button>
          </div>
        </div>
      </section>

      <section class="preview" aria-live="polite">
        <p class="preview-title">Preview area</p>
        <div class="preview-box">
          <p class="preview-mode">${state.viewMode === 'list' ? 'List results' : 'Map results'}</p>
          <p class="preview-text">${escapeHtml(getPreviewSummary())}</p>
          ${isExpanded ? '<p class="preview-text">Search is expanded for focused query refinement.</p>' : ''}
          ${hasFilters ? '<p class="preview-text">Active filters are currently narrowing these demo results.</p>' : ''}
        </div>
      </section>

      <section class="status" aria-live="polite">
        <h2>State summary ${hasFilters ? '<span class="chip">filters active</span>' : ''}</h2>
        <div class="status-grid">
          <div class="status-item">
            <p class="status-label">Current view</p>
            <p class="status-value">${state.viewMode}</p>
          </div>
          <div class="status-item">
            <p class="status-label">Search expanded</p>
            <p class="status-value">${state.searchExpanded ? 'true' : 'false'}</p>
          </div>
          <div class="status-item">
            <p class="status-label">Search query</p>
            <p class="status-value">${state.query.trim() ? escapeHtml(state.query.trim()) : '—'}</p>
          </div>
          <div class="status-item">
            <p class="status-label">Active filter count</p>
            <p class="status-value">${state.activeFilterCount}</p>
          </div>
        </div>
      </section>
    </main>
  `;

  const searchInput = appRoot.querySelector('[data-role="search-input"]');
  if (isExpanded && searchInput && document.activeElement !== searchInput) {
    searchInput.focus();
  }
};

appRoot.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) {
    return;
  }

  const { action } = target.dataset;

  switch (action) {
    case 'collapse-search':
      state.searchExpanded = false;
      break;
    case 'toggle-filters':
      state.activeFilterCount = state.activeFilterCount > 0 ? 0 : 2;
      break;
    case 'toggle-view':
      state.viewMode = state.viewMode === 'list' ? 'map' : 'list';
      break;
    default:
      break;
  }

  render();
});

appRoot.addEventListener('focusin', (event) => {
  if (event.target.matches('[data-role="search-input"]') && !state.searchExpanded) {
    state.searchExpanded = true;
    render();
  }
});

appRoot.addEventListener('input', (event) => {
  if (!event.target.matches('[data-role="search-input"]')) {
    return;
  }

  state.query = event.target.value;
  render();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.searchExpanded) {
    state.searchExpanded = false;
    render();
  }
});

render();
