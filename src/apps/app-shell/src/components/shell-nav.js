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
        aria-pressed="${isActive ? 'true' : 'false'}"
        aria-current="${isActive ? 'page' : 'false'}"
      >
        ${section.label}
      </button>
    `;
  }).join('');
}
