export const SHELL_SECTIONS = [
  { key: 'browse', label: 'Browse', icon: 'search' },
  { key: 'collect', label: 'Collect', icon: 'add' },
  { key: 'present', label: 'Present', icon: 'play_arrow' },
  { key: 'account', label: 'Account', icon: 'account_circle' },
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
        <span class="material-icons shell-nav-icon" aria-hidden="true">${section.icon}</span>
        <span class="shell-nav-label">${section.label}</span>
      </button>
    `;
  }).join('');
}
