import { scenes } from './data.js';

const state = {
  current: 0
};

const sceneTrack = document.getElementById('scene-container');
const progressDots = document.getElementById('progress-dots');
const sceneCounter = document.getElementById('scene-counter');
const prevButton = document.getElementById('prev-scene');
const nextButton = document.getElementById('next-scene');

const getHashSceneIndex = () => {
  const hash = window.location.hash.replace('#', '');
  if (!hash) {
    return 0;
  }

  const found = scenes.findIndex((scene) => scene.id === hash);
  return found >= 0 ? found : 0;
};

const renderVisual = (visual) => {
  if (!visual) {
    return '<div class="visual-card muted">No visual configured.</div>';
  }

  switch (visual.type) {
    case 'pillars':
      return `
        <div class="visual-card pillars">
          ${visual.items.map((item) => `<span class="pill">${item}</span>`).join('')}
        </div>`;
    case 'item-card':
      return `
        <div class="visual-card item-card">
          <h3>${visual.item.title}</h3>
          <p>${visual.item.description}</p>
          <div class="tag-row"><span class="tag">what</span>${visual.item.what}</div>
        </div>`;
    case 'dimensions':
      return `
        <div class="visual-card table">
          <div class="row head"><span>Dimension</span><span>Schema interpretation</span></div>
          ${visual.rows
            .map(
              ([dimension, meaning]) =>
                `<div class="row"><span class="dim">${dimension}</span><span>${meaning}</span></div>`
            )
            .join('')}
        </div>`;
    case 'interfaces':
      return `
        <div class="visual-card table interfaces">
          <div class="row head"><span>Stage</span><span>Added structure</span><span>Interface unlocked</span></div>
          ${visual.rows
            .map(
              ([stage, structure, iface]) =>
                `<div class="row"><span>${stage}</span><span>${structure}</span><span class="iface">${iface}</span></div>`
            )
            .join('')}
        </div>`;
    case 'layers':
      return `
        <div class="visual-card layers">
          ${visual.layers
            .map(
              ([title, text], index) =>
                `<article class="layer layer-${index + 1}"><h4>${title}</h4><p>${text}</p></article>`
            )
            .join('')}
        </div>`;
    case 'levels':
      return `
        <div class="visual-card levels">
          ${visual.steps
            .map(
              ([level, title, detail]) =>
                `<div class="level"><p class="level-meta">${level}</p><h4>${title}</h4><p>${detail}</p></div>`
            )
            .join('')}
        </div>`;
    case 'json':
      return `
        <div class="visual-card json-block">
          <pre>${JSON.stringify(visual.object, null, 2)}</pre>
        </div>`;
    default:
      return '<div class="visual-card muted">Unknown visual type.</div>';
  }
};

const renderScene = (scene) => {
  const bulletHtml = scene.bullets?.length
    ? `<ul>${scene.bullets.map((line) => `<li>${line}</li>`).join('')}</ul>`
    : '';

  return `
    <section class="scene" id="${scene.id}">
      <div class="scene-content">
        <p class="kicker">${scene.kicker}</p>
        <h2>${scene.title}</h2>
        <p class="lead">${scene.lead}</p>
        ${bulletHtml}
      </div>
      <div class="scene-visual">
        ${renderVisual(scene.visual)}
      </div>
    </section>`;
};

const renderProgress = () => {
  progressDots.innerHTML = scenes
    .map(
      (scene, index) =>
        `<button type="button" class="step-dot" data-index="${index}" aria-label="Go to ${scene.title}"></button>`
    )
    .join('');
};

const syncUi = () => {
  sceneCounter.textContent = `${state.current + 1} / ${scenes.length}`;
  sceneTrack.style.transform = `translateX(-${state.current * 100}%)`;

  for (const dot of progressDots.querySelectorAll('.step-dot')) {
    dot.classList.toggle('active', Number(dot.dataset.index) === state.current);
  }

  prevButton.disabled = state.current === 0;
  nextButton.disabled = state.current === scenes.length - 1;
};

const goToScene = (index, { updateHash = true } = {}) => {
  state.current = Math.max(0, Math.min(index, scenes.length - 1));

  if (updateHash) {
    history.replaceState(null, '', `#${scenes[state.current].id}`);
  }

  syncUi();
};

const init = () => {
  sceneTrack.innerHTML = scenes.map(renderScene).join('');
  renderProgress();

  state.current = getHashSceneIndex();
  syncUi();

  prevButton.addEventListener('click', () => goToScene(state.current - 1));
  nextButton.addEventListener('click', () => goToScene(state.current + 1));

  progressDots.addEventListener('click', (event) => {
    const dot = event.target.closest('.step-dot');
    if (!dot) {
      return;
    }

    goToScene(Number(dot.dataset.index));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'PageDown') {
      goToScene(state.current + 1);
    }
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      goToScene(state.current - 1);
    }
  });

  window.addEventListener('hashchange', () => {
    goToScene(getHashSceneIndex(), { updateHash: false });
  });
};

init();
