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
  const queryLabel = state.query.trim() ? `“${state.query.trim()}”` : 'no query';
  const filterLabel = state.activeFilterCount > 0 ? `${state.activeFilterCount} active` : 'none';
  return `${state.viewMode} mode · ${queryLabel} · filters ${filterLabel}`;
};

const renderMapBackground = () => `
  <section class="map-view" aria-label="Map preview background">
    <div class="map-grid"></div>
    <div class="map-water"></div>
    <span class="pin" style="top: 28%; left: 22%"></span>
    <span class="pin" style="top: 38%; left: 62%"></span>
    <span class="pin" style="top: 54%; left: 34%"></span>
    <span class="pin" style="top: 66%; left: 72%"></span>
  </section>
`;

const renderListBackground = () => `
  <section class="list-view" aria-label="Collection results preview background">
    <div class="result-grid">
      ${Array.from({ length: 8 })
        .map(
          () => `
            <article class="result-card">
              <div class="result-thumb"></div>
              <div class="result-meta">
                <div class="line"></div>
                <div class="line short"></div>
              </div>
            </article>
          `
        )
        .join('')}
    </div>
  </section>
`;

const render = () => {
  const isExpanded = state.searchExpanded;
  const hasFilters = state.activeFilterCount > 0;

  appRoot.innerHTML = `
    <main class="screen">
      <div class="background-layer">${state.viewMode === 'map' ? renderMapBackground() : renderListBackground()}</div>

      <header class="floating-header ${isExpanded ? 'expanded' : ''}">
        <div class="control-row default-row">
          ${
            isExpanded
              ? `<button type="button" class="icon-btn" data-action="collapse-search" aria-label="Back from search">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                </button>`
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

          <button
            type="button"
            class="pill-btn${!isExpanded && hasFilters ? ' active' : ''}"
            data-action="toggle-filters"
            aria-pressed="${String(hasFilters)}"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3.5 7.5h17" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              <circle cx="8.5" cy="7.5" r="1.9" stroke="currentColor" stroke-width="2"></circle>
              <path d="M3.5 12h17" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              <circle cx="15.5" cy="12" r="1.9" stroke="currentColor" stroke-width="2"></circle>
              <path d="M3.5 16.5h17" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              <circle cx="11.5" cy="16.5" r="1.9" stroke="currentColor" stroke-width="2"></circle>
            </svg>
            <span>Filters</span>
            ${!isExpanded && hasFilters ? `<span class="badge">${state.activeFilterCount}</span>` : ''}
          </button>

          <button type="button" class="pill-btn" data-action="toggle-view">
            <span>${getViewToggleLabel()}</span>
          </button>
        </div>

        <div class="control-row secondary-row">
          <button
            type="button"
            class="pill-btn${hasFilters ? ' active' : ''}"
            data-action="toggle-filters"
            aria-pressed="${String(hasFilters)}"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3.5 7.5h17" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              <circle cx="8.5" cy="7.5" r="1.9" stroke="currentColor" stroke-width="2"></circle>
              <path d="M3.5 12h17" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              <circle cx="15.5" cy="12" r="1.9" stroke="currentColor" stroke-width="2"></circle>
              <path d="M3.5 16.5h17" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              <circle cx="11.5" cy="16.5" r="1.9" stroke="currentColor" stroke-width="2"></circle>
            </svg>
            <span>Filters</span>
            ${hasFilters ? `<span class="badge">${state.activeFilterCount}</span>` : ''}
          </button>

          <button type="button" class="pill-btn" data-action="toggle-view">
            <span>${getViewToggleLabel()}</span>
          </button>
        </div>
      </header>

      <section class="state-panel" aria-live="polite">
        <h2>Prototype state</h2>
        <div class="state-grid">
          <div class="state-item">Mode: <b>${state.viewMode}</b></div>
          <div class="state-item">Search active: <b>${state.searchExpanded ? 'true' : 'false'}</b></div>
          <div class="state-item">Filters: <b>${state.activeFilterCount}</b></div>
          <div class="state-item">Summary: <b>${escapeHtml(getPreviewSummary())}</b></div>
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

  switch (target.dataset.action) {
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
