export const SHELL_SECTIONS = [
	{ key: "connect", label: "Connect", icon: "link" },
	{ key: "browse", label: "Browse", icon: "search" },
	{ key: "collect", label: "Collect", icon: "add" },
	{ key: "present", label: "Present", icon: "play_arrow" },
	{ key: "account", label: "Account", icon: "account_circle" },
];

const ICON_PATHS = {
	search: '<circle cx="11" cy="11" r="6"></circle><path d="m16 16 5 5"></path>',
	add: '<path d="M12 5v14M5 12h14"></path>',
	link: '<path d="M10 13.5 8.5 15a3 3 0 1 1-4.2-4.2L6 9.1M14 10.5 15.5 9a3 3 0 1 1 4.2 4.2L18 14.9M8.8 12.2l6.4-.4"></path>',
	play_arrow:
		'<path d="M8 6v12l10-6-10-6Z" fill="currentColor" stroke="none"></path>',
	account_circle:
		'<circle cx="12" cy="8" r="3.2"></circle><path d="M5.5 19c.8-3 3.4-5 6.5-5s5.7 2 6.5 5"></path>',
};

function renderIcon(iconName) {
	const iconPath = ICON_PATHS[iconName] || ICON_PATHS.search;
	return `<svg class="shell-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${iconPath}</svg>`;
}

function renderNavButton(section, activeSectionKey) {
	const isActive = section.key === activeSectionKey;

	return `
		<button
			type="button"
			class="shell-nav-btn"
			data-section-key="${section.key}"
			data-icon="${section.icon}"
			${isActive ? 'aria-current="page"' : ""}
		>
			${renderIcon(section.icon)}
			<span class="shell-nav-label">${section.label}</span>
		</button>
	`;
}

export function renderShellHeader(
	activeSectionKey,
	title = "Open Collections",
) {
	const primarySections = SHELL_SECTIONS.filter(
		(section) => section.key !== "account",
	);
	const accountSection = SHELL_SECTIONS.find(
		(section) => section.key === "account",
	);

	return `
		<header class="oc-app-bar">
			<div class="oc-app-bar__title">${title}</div>

			<nav class="shell-nav shell-nav--primary" aria-label="Primary navigation">
				${primarySections.map((section) => renderNavButton(section, activeSectionKey)).join("")}
			</nav>

			<div class="shell-nav shell-nav--account">
				${accountSection ? renderNavButton(accountSection, activeSectionKey) : ""}
			</div>
		</header>
	`;
}
