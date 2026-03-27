export const SHELL_SECTIONS = [
  { key: 'browse', label: 'Browse', icon: 'search' },
  { key: 'collect', label: 'Collect', icon: 'add' },
  { key: 'present', label: 'Present', icon: 'play_arrow' },
  { key: 'account', label: 'Account', icon: 'account_circle' },
];

const ICON_PATHS = {
  search: '<circle cx="11" cy="11" r="6"></circle><path d="m16 16 5 5"></path>',
  add: '<path d="M12 5v14M5 12h14"></path>',
  play_arrow: '<path d="M8 6v12l10-6-10-6Z" fill="currentColor" stroke="none"></path>',
  account_circle:
    '<circle cx="12" cy="8" r="3.2"></circle><path d="M5.5 19c.8-3 3.4-5 6.5-5s5.7 2 6.5 5"></path>',
};

function renderIcon(iconName) {
  const iconPath = ICON_PATHS[iconName] || ICON_PATHS.search;
  return `<svg class="shell-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${iconPath}</svg>`;
}

export function renderShellNav(activeSectionKey) {
  return SHELL_SECTIONS.map((section) => {
    const isActive = section.key === activeSectionKey;
    return `
      <button
        type="button"
        class="shell-nav-btn"
        data-section-key="${section.key}"
        data-icon="${section.icon}"
        ${isActive ? 'aria-current="page"' : ''}
      >
        ${renderIcon(section.icon)}
        <span class="shell-nav-label">${section.label}</span>
      </button>
    `;
  }).join('');
}
