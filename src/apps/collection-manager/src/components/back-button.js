export const backButtonStyles = `
  .back-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    min-width: 2rem;
    padding: 0;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #ffffff;
    color: #0f172a;
    cursor: pointer;
    font: inherit;
    line-height: 1;
    flex: 0 0 auto;
  }

  .back-btn:hover {
    background: #f8fafc;
  }

  .back-btn:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }

  .back-btn .icon {
    width: 1.1rem;
    height: 1.1rem;
    fill: currentColor;
  }
`;

export function renderBackButton({
  id = 'backBtn',
  className = 'back-btn',
  label = 'Back',
  hidden = false,
} = {}) {
  const hiddenClass = hidden ? ' is-hidden' : '';
  return `
    <button class="${className}${hiddenClass}" id="${id}" type="button" aria-label="${label}">
      <svg class="icon icon-back" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z" />
      </svg>
    </button>
  `;
}
