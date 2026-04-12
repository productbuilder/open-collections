import { scenes } from './data.js';

const state = {
  current: 0,
  sceneEls: []
};

const sceneContainer = document.getElementById('scene-container');
const progressRail = document.getElementById('progress-rail');
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

const renderScene = (scene, index) => {
  const bulletHtml = scene.bullets?.length
    ? `<ul>${scene.bullets.map((line) => `<li>${line}</li>`).join('')}</ul>`
    : '';

  return `
    <section class="scene" id="${scene.id}" data-index="${index}">
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
  progressRail.innerHTML = scenes
    .map(
      (scene, index) => `
      <a href="#${scene.id}" class="progress-dot" data-index="${index}" aria-label="Go to ${scene.title}">
        <span>${String(index + 1).padStart(2, '0')}</span>
      </a>`
    )
    .join('');
};

const syncUi = () => {
  sceneCounter.textContent = `${state.current + 1} / ${scenes.length}`;

  for (const [index, sceneEl] of state.sceneEls.entries()) {
    sceneEl.classList.toggle('active', index === state.current);
  }

  for (const dot of progressRail.querySelectorAll('.progress-dot')) {
    dot.classList.toggle('active', Number(dot.dataset.index) === state.current);
  }

  prevButton.disabled = state.current === 0;
  nextButton.disabled = state.current === scenes.length - 1;
};

const goToScene = (index, { updateHash = true } = {}) => {
  state.current = Math.max(0, Math.min(index, scenes.length - 1));
  const activeScene = scenes[state.current];

  if (updateHash) {
    history.replaceState(null, '', `#${activeScene.id}`);
  }

  state.sceneEls[state.current].scrollIntoView({ behavior: 'smooth', block: 'start' });
  syncUi();
};

const init = () => {
  sceneContainer.innerHTML = scenes.map(renderScene).join('');
  state.sceneEls = Array.from(sceneContainer.querySelectorAll('.scene'));
  renderProgress();

  state.current = getHashSceneIndex();
  syncUi();
  state.sceneEls[state.current].scrollIntoView({ behavior: 'auto', block: 'start' });

  prevButton.addEventListener('click', () => goToScene(state.current - 1));
  nextButton.addEventListener('click', () => goToScene(state.current + 1));

  progressRail.addEventListener('click', (event) => {
    const link = event.target.closest('.progress-dot');
    if (!link) {
      return;
    }
    event.preventDefault();
    goToScene(Number(link.dataset.index));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'PageDown') {
      goToScene(state.current + 1);
    }
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      goToScene(state.current - 1);
    }
    if (event.key === 'Home') {
      goToScene(0);
    }
    if (event.key === 'End') {
      goToScene(scenes.length - 1);
    }
  });

  window.addEventListener('hashchange', () => {
    goToScene(getHashSceneIndex(), { updateHash: false });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) {
        return;
      }

      const index = Number(visible.target.dataset.index);
      if (index !== state.current) {
        state.current = index;
        history.replaceState(null, '', `#${scenes[index].id}`);
        syncUi();
      }
    },
    {
      threshold: [0.55, 0.8]
    }
  );

  for (const sceneEl of state.sceneEls) {
    observer.observe(sceneEl);
  }
};

init();
