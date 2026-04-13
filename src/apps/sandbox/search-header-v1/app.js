const state = {
  viewMode: 'list',
  searchExpanded: false,
  query: '',
  activeFilterCount: 0
};

const appRoot = document.getElementById('app');

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

const createUi = () => {
  appRoot.innerHTML = `
    <main class="screen">
      <div class="background-layer" data-role="background-layer"></div>

      <header class="floating-header" data-role="floating-header">
        <div class="control-row" data-role="control-row">
          <label class="search-wrap" aria-label="Search" data-role="search-wrap">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="2"></circle>
              <path d="M16 16 L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
            </svg>
            <input
              class="search-input"
              data-role="search-input"
              type="search"
              placeholder="Search"
            />
            <button type="button" class="icon-btn clear-btn" data-action="clear-search" aria-label="Clear search" data-role="clear-search">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              </svg>
            </button>
          </label>

          <div class="row-actions" data-role="row-actions">
            <button
              type="button"
              class="pill-btn"
              data-action="toggle-filters"
              data-role="filters-btn"
              aria-pressed="false"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 9h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
                <circle cx="9" cy="9" r="1.5" stroke="currentColor" stroke-width="1.8"></circle>
                <path d="M4 15h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
                <circle cx="15" cy="15" r="1.5" stroke="currentColor" stroke-width="1.8"></circle>
              </svg>
              <span>Filters</span>
              <span class="badge" data-role="filters-badge" hidden></span>
            </button>

            <button type="button" class="pill-btn" data-action="toggle-view" data-role="view-btn">
              <span data-role="view-btn-icon"></span>
              <span data-role="view-btn-label"></span>
            </button>
          </div>
        </div>
      </header>

      <section class="state-panel" aria-live="polite">
        <h2>Prototype state</h2>
        <div class="state-grid">
          <div class="state-item">Mode: <b data-role="state-mode"></b></div>
          <div class="state-item">Search active: <b data-role="state-search-active"></b></div>
          <div class="state-item">Filters: <b data-role="state-filters"></b></div>
          <div class="state-item">Summary: <b data-role="state-summary"></b></div>
        </div>
      </section>
    </main>
  `;
};

const refs = {};

const cacheRefs = () => {
  refs.floatingHeader = appRoot.querySelector('[data-role="floating-header"]');
  refs.searchWrap = appRoot.querySelector('[data-role="search-wrap"]');
  refs.searchInput = appRoot.querySelector('[data-role="search-input"]');
  refs.clearSearch = appRoot.querySelector('[data-role="clear-search"]');
  refs.rowActions = appRoot.querySelector('[data-role="row-actions"]');
  refs.filtersBtn = appRoot.querySelector('[data-role="filters-btn"]');
  refs.filtersBadge = appRoot.querySelector('[data-role="filters-badge"]');
  refs.viewBtnIcon = appRoot.querySelector('[data-role="view-btn-icon"]');
  refs.viewBtnLabel = appRoot.querySelector('[data-role="view-btn-label"]');
  refs.backgroundLayer = appRoot.querySelector('[data-role="background-layer"]');
  refs.stateMode = appRoot.querySelector('[data-role="state-mode"]');
  refs.stateSearchActive = appRoot.querySelector('[data-role="state-search-active"]');
  refs.stateFilters = appRoot.querySelector('[data-role="state-filters"]');
  refs.stateSummary = appRoot.querySelector('[data-role="state-summary"]');
};

const render = () => {
  const hasQuery = state.query.trim().length > 0;
  const hasFilters = state.activeFilterCount > 0;

  refs.floatingHeader.classList.toggle('expanded', state.searchExpanded);
  refs.searchWrap.classList.toggle('expanded', state.searchExpanded);
  refs.searchWrap.classList.toggle('has-query', hasQuery);

  if (refs.searchInput.value !== state.query) {
    refs.searchInput.value = state.query;
  }

  refs.clearSearch.hidden = !hasQuery;

  refs.filtersBtn.classList.toggle('active', hasFilters);
  refs.filtersBtn.setAttribute('aria-pressed', String(hasFilters));
  refs.filtersBadge.hidden = !hasFilters;
  refs.filtersBadge.textContent = hasFilters ? String(state.activeFilterCount) : '';

  refs.viewBtnIcon.innerHTML = getViewToggleIcon();
  refs.viewBtnLabel.textContent = getViewToggleLabel();

  refs.backgroundLayer.innerHTML = state.viewMode === 'map' ? renderMapBackground() : renderListBackground();

  refs.stateMode.textContent = state.viewMode;
  refs.stateSearchActive.textContent = String(state.searchExpanded);
  refs.stateFilters.textContent = String(state.activeFilterCount);
  refs.stateSummary.textContent = getPreviewSummary();
};

const expandSearch = ({ focus = false } = {}) => {
  if (!state.searchExpanded) {
    state.searchExpanded = true;
    render();
  }

  if (focus && document.activeElement !== refs.searchInput) {
    refs.searchInput.focus({ preventScroll: true });
  }
};

const collapseSearch = () => {
  if (!state.searchExpanded) {
    return;
  }

  state.searchExpanded = false;
  render();
};

appRoot.addEventListener('pointerdown', (event) => {
  if (!event.target.closest('[data-role="search-wrap"]') || state.searchExpanded) {
    return;
  }

  // Expand before focus is finalized so first tap both opens and places caret.
  expandSearch();
});

appRoot.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) {
    return;
  }

  switch (target.dataset.action) {
    case 'clear-search':
      state.query = '';
      render();
      refs.searchInput.focus({ preventScroll: true });
      break;
    case 'toggle-filters':
      state.activeFilterCount = state.activeFilterCount > 0 ? 0 : 2;
      render();
      break;
    case 'toggle-view':
      state.viewMode = state.viewMode === 'list' ? 'map' : 'list';
      render();
      break;
    default:
      break;
  }
});

appRoot.addEventListener('focusin', (event) => {
  if (event.target.matches('[data-role="search-input"]')) {
    expandSearch({ focus: false });
  }
});

appRoot.addEventListener('focusout', (event) => {
  if (!event.target.matches('[data-role="search-input"]')) {
    return;
  }

  requestAnimationFrame(() => {
    const nextFocus = document.activeElement;
    if (nextFocus === refs.searchInput) {
      return;
    }

    if (nextFocus && nextFocus.closest('[data-role="search-wrap"]')) {
      return;
    }

    collapseSearch();
  });
});

appRoot.addEventListener('input', (event) => {
  if (!event.target.matches('[data-role="search-input"]')) {
    return;
  }

  state.query = event.target.value;
  render();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (state.query) {
      state.query = '';
      render();
      refs.searchInput.focus({ preventScroll: true });
      return;
    }

    refs.searchInput.blur();
    collapseSearch();
  }
});

document.addEventListener('pointerdown', (event) => {
  if (!state.searchExpanded) {
    return;
  }

  if (event.target.closest('.floating-header')) {
    return;
  }

  collapseSearch();
});

createUi();
cacheRefs();
render();
