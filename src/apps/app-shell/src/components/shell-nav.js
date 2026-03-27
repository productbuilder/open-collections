export const SHELL_SECTIONS = [
  { key: 'browse', label: 'Browse' },
  { key: 'collect', label: 'Collect' },
  { key: 'present', label: 'Present' },
  { key: 'account', label: 'Account' },
];

export function renderShellNav(activeSectionKey) {
  return SHELL_SECTIONS.map((section) => {
    const isActive = section.key === activeSectionKey;
    return `
      <button
        type="button"
        class="shell-nav-btn"
        data-section-key="${section.key}"
        ${isActive ? 'aria-current="page"' : ''}
      >
        <span class="shell-nav-icon" aria-hidden="true"></span>
        <span class="shell-nav-label">${section.label}</span>
      </button>
    `;
  }).join('');
}
