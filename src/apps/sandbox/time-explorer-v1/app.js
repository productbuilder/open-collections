import { items, stories } from './data.js';

const sortedItems = [...items].sort((a, b) => a.year - b.year);
const years = [...new Set(sortedItems.map((item) => item.year))].sort((a, b) => a - b);

const state = {
  selectedStoryId: 'all',
  activeYear: years[Math.floor(years.length / 2)],
  activeItemId: null,
  viewState: 'explore',
  isPlaying: false
};

const ui = {
  app: document.getElementById('app'),
  playTimer: null
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const getStoryById = (storyId) => stories.find((story) => story.id === storyId) ?? stories[0];

const getFilteredItems = () => {
  if (state.selectedStoryId === 'all') {
    return sortedItems;
  }

  return sortedItems.filter((item) => item.storyIds.includes(state.selectedStoryId));
};

const getNearestItemForYear = (itemList, year) => {
  if (!itemList.length) {
    return null;
  }

  return itemList.reduce((nearest, candidate) => {
    const nearestDiff = Math.abs(nearest.year - year);
    const candidateDiff = Math.abs(candidate.year - year);

    if (candidateDiff < nearestDiff) {
      return candidate;
    }

    if (candidateDiff === nearestDiff && candidate.year < nearest.year) {
      return candidate;
    }

    return nearest;
  });
};

const getItemIndex = (itemList, itemId) => itemList.findIndex((item) => item.id === itemId);

const syncActiveItem = () => {
  const filtered = getFilteredItems();
  if (!filtered.length) {
    state.activeItemId = null;
    return;
  }

  const activeStillVisible = filtered.some((item) => item.id === state.activeItemId);

  if (!activeStillVisible) {
    const nearest = getNearestItemForYear(filtered, state.activeYear);
    state.activeItemId = nearest?.id ?? filtered[0].id;
    return;
  }

  const activeItem = filtered.find((item) => item.id === state.activeItemId);
  if (activeItem) {
    state.activeYear = activeItem.year;
  }
};

const setYear = (yearValue) => {
  state.activeYear = Number(yearValue);
  if (state.viewState !== 'explore') {
    const nearest = getNearestItemForYear(getFilteredItems(), state.activeYear);
    state.activeItemId = nearest?.id ?? null;
    if (nearest) {
      state.activeYear = nearest.year;
    }
  }
};

const stopAutoplay = () => {
  if (ui.playTimer) {
    window.clearInterval(ui.playTimer);
  }
  ui.playTimer = null;
  state.isPlaying = false;
};

const startAutoplay = () => {
  const filtered = getFilteredItems();
  if (filtered.length < 2) {
    return;
  }

  state.isPlaying = true;
  ui.playTimer = window.setInterval(() => {
    const activeIndex = getItemIndex(filtered, state.activeItemId);
    if (activeIndex >= filtered.length - 1) {
      stopAutoplay();
      render();
      return;
    }

    const nextItem = filtered[Math.max(0, activeIndex + 1)];
    state.activeItemId = nextItem.id;
    state.activeYear = nextItem.year;
    render();
  }, 1800);
};

const setStory = (storyId) => {
  stopAutoplay();
  state.selectedStoryId = storyId;

  if (storyId === 'all') {
    state.viewState = 'explore';
    state.activeItemId = null;
    return;
  }

  state.viewState = 'story';
  const filtered = getFilteredItems();
  const nearest = getNearestItemForYear(filtered, state.activeYear);
  state.activeItemId = nearest?.id ?? filtered[0]?.id ?? null;
  if (state.activeItemId) {
    const activeItem = filtered.find((item) => item.id === state.activeItemId);
    state.activeYear = activeItem?.year ?? state.activeYear;
  }
};

const enterFocusForItem = (itemId) => {
  stopAutoplay();
  state.viewState = state.selectedStoryId === 'all' ? 'focus' : 'story';
  state.activeItemId = itemId;
  const target = sortedItems.find((item) => item.id === itemId);
  if (target) {
    state.activeYear = target.year;
  }
};

const exitFocusToExplore = () => {
  stopAutoplay();
  state.viewState = 'explore';
  state.activeItemId = null;
  if (state.selectedStoryId !== 'all') {
    state.selectedStoryId = 'all';
  }
};

const timelineHint = (filtered, activeItem) => {
  if (!filtered.length) {
    return 'No items available.';
  }

  if (state.viewState === 'explore') {
    return 'Move through years to emphasize nearby points. Click a point to focus.';
  }

  const index = getItemIndex(filtered, activeItem?.id);
  return `Card ${Math.max(index + 1, 1)} of ${filtered.length} in the current ${state.viewState} set.`;
};

const renderStoryChips = () => `
  <header class="story-strip" aria-label="Story strip">
    ${stories
      .map((story) => {
        const isSelected = story.id === state.selectedStoryId;
        return `
          <button
            type="button"
            class="story-chip${isSelected ? ' is-selected' : ''}"
            data-action="select-story"
            data-story-id="${escapeHtml(story.id)}"
            style="--story-accent: ${escapeHtml(story.accent)}"
          >
            ${escapeHtml(story.title)}
          </button>
        `;
      })
      .join('')}
  </header>
`;

const renderStage = (filtered, activeItem) => {
  const yearWindow = 18;

  return `
    <section class="stage-wrap" aria-label="Map and space stage">
      <div class="stage-horizon" aria-hidden="true"></div>
      <div class="stage-grid" aria-hidden="true"></div>
      ${filtered
        .map((item) => {
          const yearDistance = Math.abs(item.year - state.activeYear);
          const isNear = yearDistance <= yearWindow;
          const isActive = activeItem?.id === item.id;
          const focusClass = isActive ? ' is-active' : isNear ? ' is-near' : '';

          return `
            <button
              type="button"
              class="map-point${focusClass}"
              data-action="select-item"
              data-item-id="${escapeHtml(item.id)}"
              style="--x:${item.lonLike}%; --y:${item.latLike}%; --distance:${yearDistance};"
              title="${escapeHtml(item.title)} (${item.year})"
            >
              <span class="dot"></span>
              <span class="point-label">${escapeHtml(item.title)}</span>
            </button>
          `;
        })
        .join('')}
      ${renderCardStack(filtered, activeItem)}
    </section>
  `;
};

const renderCardStack = (filtered, activeItem) => {
  if (!activeItem || state.viewState === 'explore') {
    return '';
  }

  const index = getItemIndex(filtered, activeItem.id);
  const previous = filtered[index - 1] ?? null;
  const next = filtered[index + 1] ?? null;

  const renderGhost = (item, relation) => {
    if (!item) {
      return '';
    }

    return `
      <article class="ghost-card ghost-card-${relation}">
        <p class="ghost-year">${item.year}</p>
        <h4>${escapeHtml(item.title)}</h4>
      </article>
    `;
  };

  return `
    <div class="card-layer" style="--card-x:${activeItem.lonLike}%; --card-y:${activeItem.latLike}%;">
      ${renderGhost(previous, 'prev')}
      <article class="focus-card">
        <p class="focus-meta">${activeItem.year} · ${escapeHtml(activeItem.imageLabel)}</p>
        <h3>${escapeHtml(activeItem.title)}</h3>
        <p>${escapeHtml(activeItem.description)}</p>
      </article>
      ${renderGhost(next, 'next')}
    </div>
  `;
};

const renderNarrativePanel = (filtered, activeItem) => {
  const currentStory = getStoryById(state.selectedStoryId);
  const compactClass = state.viewState === 'explore' ? ' is-compact' : '';

  const title =
    state.viewState === 'story'
      ? `${currentStory.title} story`
      : activeItem
        ? activeItem.title
        : 'Explore the timeline';

  const blurb =
    state.viewState === 'story'
      ? currentStory.summary
      : activeItem
        ? activeItem.description
        : 'Use the timeline to reveal items near a selected year, then click a point to inspect it as a card.';

  return `
    <section class="narrative-panel${compactClass}" aria-live="polite">
      <div class="narrative-copy">
        <p class="meta-row">
          <span>${state.viewState.toUpperCase()}</span>
          <span>Year ${state.activeYear}</span>
        </p>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(blurb)}</p>
      </div>
      <div class="narrative-image" aria-hidden="true">
        <span>${escapeHtml(activeItem?.imageLabel ?? 'Image placeholder')}</span>
      </div>
      <div class="panel-actions">
        ${
          state.viewState !== 'explore'
            ? '<button type="button" data-action="back-to-explore">Back to explore</button>'
            : ''
        }
        ${
          state.viewState === 'story'
            ? `<button type="button" data-action="toggle-play">${
                state.isPlaying ? 'Pause' : 'Play'
              } story</button>`
            : ''
        }
      </div>
      <p class="timeline-hint">${escapeHtml(timelineHint(filtered, activeItem))}</p>
    </section>
  `;
};

const renderTimeline = (filtered) => {
  const minYear = years[0];
  const maxYear = years[years.length - 1];

  return `
    <footer class="timeline-wrap" aria-label="Timeline controls">
      <div class="timeline-year">${state.activeYear}</div>
      <input
        type="range"
        min="${minYear}"
        max="${maxYear}"
        step="1"
        value="${state.activeYear}"
        data-action="timeline-input"
        aria-label="Timeline year"
      />
      <div class="timeline-ends">
        <span>${minYear}</span>
        <span>${maxYear}</span>
      </div>
      <p class="timeline-count">${filtered.length} items in current filter</p>
    </footer>
  `;
};

const render = () => {
  syncActiveItem();

  const filtered = getFilteredItems();
  const activeItem = filtered.find((item) => item.id === state.activeItemId) ?? getNearestItemForYear(filtered, state.activeYear);

  ui.app.innerHTML = `
    <main class="explorer-shell" data-state="${state.viewState}">
      <h1>Time Explorer v1 <small>(sandbox)</small></h1>
      ${renderStoryChips()}
      ${renderStage(filtered, activeItem)}
      ${renderNarrativePanel(filtered, activeItem)}
      ${renderTimeline(filtered)}
    </main>
  `;
};

ui.app.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) {
    return;
  }

  const { action, storyId, itemId } = target.dataset;

  switch (action) {
    case 'select-story': {
      setStory(storyId);
      break;
    }
    case 'select-item': {
      enterFocusForItem(itemId);
      break;
    }
    case 'back-to-explore': {
      exitFocusToExplore();
      break;
    }
    case 'toggle-play': {
      if (state.isPlaying) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
      break;
    }
    default:
      break;
  }

  render();
});

ui.app.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.dataset.action !== 'timeline-input') {
    return;
  }

  setYear(target.value);
  render();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.viewState !== 'explore') {
    exitFocusToExplore();
    render();
  }
});

render();
