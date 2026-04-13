import { flowSteps } from './data.js';

const initialState = {
  isOpen: true,
  currentStepIndex: 0,
  selections: {},
  expandedMoreInfo: {}
};

const state = structuredClone(initialState);

const appRoot = document.getElementById('app');

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const getCurrentStep = () => flowSteps[state.currentStepIndex];

const hasRequiredSelection = (step) => {
  if (!step.required || !step.selectionKey) {
    return true;
  }
  return Boolean(state.selections[step.selectionKey]);
};

const isNextEnabled = () => {
  const step = getCurrentStep();
  if (!state.isOpen) {
    return false;
  }
  if (state.currentStepIndex === flowSteps.length - 1) {
    return true;
  }
  return hasRequiredSelection(step);
};

const renderOptions = (step) => {
  if (!step.options?.length) {
    return '';
  }

  const selectedValue = state.selections[step.selectionKey];

  return `
    <div class="options" role="listbox" aria-label="${escapeHtml(step.title)} options">
      ${step.options
        .map((option) => {
          const isSelected = selectedValue === option;
          return `
            <button
              type="button"
              class="option-card${isSelected ? ' selected' : ''}"
              data-action="select-option"
              data-value="${escapeHtml(option)}"
              aria-pressed="${String(isSelected)}"
            >
              <span>${escapeHtml(option)}</span>
              <span class="checkmark" aria-hidden="true">${isSelected ? '✓' : ''}</span>
            </button>
          `;
        })
        .join('')}
    </div>
  `;
};

const renderMoreInfo = (step) => {
  if (!step.moreInfo) {
    return '';
  }

  const isExpanded = Boolean(state.expandedMoreInfo[step.id]);

  return `
    <section class="more-info-block">
      <button
        type="button"
        class="more-info-toggle"
        data-action="toggle-more-info"
        aria-expanded="${String(isExpanded)}"
      >
        <span>${isExpanded ? 'Hide details' : 'More info'}</span>
        <span aria-hidden="true">${isExpanded ? '−' : '+'}</span>
      </button>
      <div class="more-info-content${isExpanded ? ' expanded' : ''}">
        <p>${escapeHtml(step.moreInfo)}</p>
      </div>
    </section>
  `;
};

const renderSummary = () => {
  const summaryEntries = Object.entries(state.selections);

  return `
    <section class="summary" aria-live="polite">
      <h3>Selected setup</h3>
      <ul>
        ${summaryEntries
          .map(([key, value]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</li>`)
          .join('')}
      </ul>
      <pre>${escapeHtml(JSON.stringify(state.selections, null, 2))}</pre>
      <button type="button" class="primary-action" data-action="start-creating">Start creating</button>
    </section>
  `;
};

const renderDialog = () => {
  if (!state.isOpen) {
    return `
      <div class="dialog-closed">
        <p>Flow closed.</p>
        <button type="button" data-action="reopen-flow">Reopen flow</button>
      </div>
    `;
  }

  const step = getCurrentStep();
  const isFirstStep = state.currentStepIndex === 0;
  const isLastStep = state.currentStepIndex === flowSteps.length - 1;
  const progressPercent = ((state.currentStepIndex + 1) / flowSteps.length) * 100;

  return `
    <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <header class="dialog-header">
        <div>
          <p class="step-label">Step ${state.currentStepIndex + 1} of ${flowSteps.length}</p>
          <h2 id="dialog-title">${escapeHtml(step.title)}</h2>
        </div>
        <button type="button" class="close-btn" data-action="close-flow" aria-label="Close flow">✕</button>
      </header>

      <div class="progress-track" aria-hidden="true">
        <div class="progress-fill" style="width: ${progressPercent}%;"></div>
      </div>

      <p class="description">${escapeHtml(step.description)}</p>

      ${renderMoreInfo(step)}

      ${isLastStep ? renderSummary() : renderOptions(step)}

      <footer class="dialog-footer">
        <button type="button" data-action="go-back" ${isFirstStep ? 'disabled' : ''}>Back</button>
        <button type="button" data-action="go-next" ${isNextEnabled() ? '' : 'disabled'}>
          ${isLastStep ? 'Finish' : 'Next'}
        </button>
      </footer>
    </section>
  `;
};

const render = () => {
  appRoot.innerHTML = `
    <main class="shell">
      <h1>Open Collections · Dialog Flow v1</h1>
      <p class="intro">A versioned sandbox prototype for guided decision flows.</p>
      ${renderDialog()}
    </main>
  `;
};

const resetFlow = () => {
  Object.assign(state, structuredClone(initialState));
};

appRoot.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) {
    return;
  }

  const { action, value } = target.dataset;
  const currentStep = getCurrentStep();

  switch (action) {
    case 'select-option': {
      if (currentStep.selectionKey) {
        state.selections[currentStep.selectionKey] = value;
      }
      break;
    }
    case 'toggle-more-info': {
      state.expandedMoreInfo[currentStep.id] = !state.expandedMoreInfo[currentStep.id];
      break;
    }
    case 'go-back': {
      state.currentStepIndex = Math.max(0, state.currentStepIndex - 1);
      break;
    }
    case 'go-next': {
      if (!isNextEnabled()) {
        break;
      }
      state.currentStepIndex = Math.min(flowSteps.length - 1, state.currentStepIndex + 1);
      break;
    }
    case 'close-flow': {
      resetFlow();
      state.isOpen = false;
      break;
    }
    case 'reopen-flow': {
      state.isOpen = true;
      break;
    }
    case 'start-creating': {
      window.alert(`Prototype action:\n\n${JSON.stringify(state.selections, null, 2)}`);
      break;
    }
    default:
      break;
  }

  render();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.isOpen) {
    resetFlow();
    state.isOpen = false;
    render();
    return;
  }

  if (event.key === 'Enter' && isNextEnabled() && state.isOpen) {
    const isLastStep = state.currentStepIndex === flowSteps.length - 1;
    if (!isLastStep) {
      state.currentStepIndex += 1;
      render();
    }
  }
});

render();
