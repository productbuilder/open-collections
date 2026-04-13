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
const getViewToggleIcon = () =>
  state.viewMode === 'list'
    ? `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 6.5 3.5 8v10l4.5-1.5 8 1.5 4.5-1.5V6.5L16 8 8 6.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>
        <path d="M8 6.5v10M16 8v10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
      </svg>`
    : `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="5" width="7" height="6" rx="1.4" stroke="currentColor" stroke-width="1.8"></rect>
        <rect x="13" y="5" width="7" height="6" rx="1.4" stroke="currentColor" stroke-width="1.8"></rect>
        <rect x="4" y="13" width="7" height="6" rx="1.4" stroke="currentColor" stroke-width="1.8"></rect>
        <rect x="13" y="13" width="7" height="6" rx="1.4" stroke="currentColor" stroke-width="1.8"></rect>
      </svg>`;

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
        <div class="control-row base-row" aria-hidden="${isExpanded ? 'true' : 'false'}">
          <label class="search-wrap compact" aria-label="Search collections">
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
            ${getViewToggleIcon()}
            <span>${getViewToggleLabel()}</span>
          </button>
        </div>

        <div class="search-overlay" aria-hidden="${isExpanded ? 'false' : 'true'}">
          <label class="search-wrap expanded" aria-label="Search collections">
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
            ${
              state.query
                ? `<button type="button" class="icon-btn clear-btn" data-action="clear-search" aria-label="Clear search">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                    </svg>
                  </button>`
                : ''
            }
          </label>
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
  if (state.searchExpanded && !event.target.closest('.floating-header')) {
    state.searchExpanded = false;
    render();
    return;
  }

  const target = event.target.closest('[data-action]');
  if (!target) {
    return;
  }

  switch (target.dataset.action) {
    case 'clear-search':
      state.query = '';
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

document.addEventListener('pointerdown', (event) => {
  if (!state.searchExpanded) {
    return;
  }

  if (event.target.closest('.floating-header')) {
    return;
  }

  state.searchExpanded = false;
  render();
});

render();
