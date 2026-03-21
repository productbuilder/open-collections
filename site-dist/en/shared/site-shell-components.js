const DEFAULT_SITE_I18N = {
	locale: 'en',
	languages: {
		en: 'English',
		nl: 'Nederlands',
	},
	shell: {
		brand: 'Open Collections',
		navAriaLabel: 'Primary navigation',
		languageSwitcherLabel: 'Language',
		languageSwitcherAriaLabel: 'Select language',
		nav: {
			home: 'Home',
			'get-started': 'Get started',
			tools: 'Tools',
			hosting: 'Hosting',
			docs: 'Docs',
		},
		footer: {
			description: 'An open, web-based approach to publishing and sharing cultural collections.',
			groups: {
				project: 'Project',
				'docs-and-developer': 'Docs and developer',
				collections: 'Collections',
			},
			links: {
				home: 'Home',
				'get-started': 'Get started',
				tools: 'Tools',
				docs: 'Docs',
				hosting: 'Hosting',
				registry: 'Registry',
				organizations: 'Organizations',
			},
		},
		breadcrumbs: {
			home: 'Home',
		},
		untranslatedNotice: {
			title: 'Translation in progress',
			body: 'This page is not translated into this language yet.',
		},
	},
	docsNav: {
		ariaLabel: 'Docs navigation',
		items: [],
	},
};

const NAV_ITEMS = [
	{ key: 'home', href: '' },
	{ key: 'get-started', href: 'get-started/' },
	{ key: 'tools', href: 'tools/' },
	{ key: 'hosting', href: 'hosting/' },
	{ key: 'docs', href: 'docs/' },
];

const FOOTER_GROUPS = [
	{
		key: 'project',
		links: [
			{ key: 'home', href: '' },
			{ key: 'get-started', href: 'get-started/' },
			{ key: 'tools', href: 'tools/' },
		],
	},
	{
		key: 'docs-and-developer',
		links: [
			{ key: 'docs', href: 'docs/' },
			{ key: 'hosting', href: 'hosting/' },
		],
	},
	{
		key: 'collections',
		links: [
			{ key: 'registry', href: 'registry/' },
			{ key: 'organizations', href: 'index.html#organizations-using-open-collections' },
		],
	},
];

function mergeDeep(base, override) {
	if (!override || typeof override !== 'object') {
		return structuredClone(base);
	}
	const output = Array.isArray(base) ? [...base] : { ...base };
	for (const [key, value] of Object.entries(override)) {
		if (value && typeof value === 'object' && !Array.isArray(value) && base && typeof base[key] === 'object' && base[key] !== null && !Array.isArray(base[key])) {
			output[key] = mergeDeep(base[key], value);
			continue;
		}
		output[key] = value;
	}
	return output;
}

function toBasePath(value) {
	if (!value) {
		return './';
	}
	return value.endsWith('/') ? value : `${value}/`;
}

function getSiteContext() {
	const context = window.OPEN_COLLECTIONS_SITE ?? {};
	return {
		...context,
		i18n: mergeDeep(DEFAULT_SITE_I18N, context.i18n ?? {}),
	};
}

function resolveHref(basePath, href) {
	if (!href) {
		return basePath;
	}
	if (/^(?:[a-z]+:|#|\/)/i.test(href)) {
		return href;
	}
	return `${basePath}${href}`;
}

function renderLanguageSwitcher(basePath, context) {
	const languages = context.i18n.languages ?? DEFAULT_SITE_I18N.languages;
	const currentLocale = context.locale ?? context.i18n.locale ?? 'en';
	const alternates = context.alternates ?? {};
	const options = Object.entries(languages)
		.map(([locale, label]) => {
			const selected = locale === currentLocale ? ' selected' : '';
			const target = alternates[locale] ?? '';
			return `<option value="${target}" lang="${locale}"${selected}>${label}</option>`;
		})
		.join('');
	const t = context.i18n.shell;
	return `
		<label class="site-language-switcher" aria-label="${t.languageSwitcherAriaLabel}">
			<span>${t.languageSwitcherLabel}</span>
			<select data-language-switcher>
				${options}
			</select>
		</label>
	`;
}

class OpenCollectionsSiteHeader extends HTMLElement {
	connectedCallback() {
		const basePath = toBasePath(this.getAttribute('base-path'));
		const context = getSiteContext();
		const activePage = this.getAttribute('active-page') ?? context.page?.activeSection ?? '';
		const t = context.i18n.shell;

		const navLinks = NAV_ITEMS.map((item) => {
			const isActive = item.key === activePage;
			const classes = isActive ? ' class="is-active"' : '';
			const currentPage = isActive ? ' aria-current="page"' : '';
			const label = t.nav[item.key] ?? item.key;
			return `<a href="${resolveHref(basePath, item.href)}"${classes}${currentPage}>${label}</a>`;
		}).join('');

		this.innerHTML = `
			<div class="site-header">
				<div class="site-header-inner">
					<div class="site-brand">${t.brand}</div>
					<nav class="site-nav" aria-label="${t.navAriaLabel}">${navLinks}</nav>
					${renderLanguageSwitcher(basePath, context)}
				</div>
			</div>
		`;

		const switcher = this.querySelector('[data-language-switcher]');
		if (switcher) {
			switcher.addEventListener('change', (event) => {
				const target = event.currentTarget.value;
				if (target) {
					window.location.assign(target);
				}
			});
		}
	}
}

class OpenCollectionsSiteFooter extends HTMLElement {
	connectedCallback() {
		const basePath = toBasePath(this.getAttribute('base-path'));
		const context = getSiteContext();
		const t = context.i18n.shell;
		const footerGroups = FOOTER_GROUPS.map((group) => {
			const title = t.footer.groups[group.key] ?? group.key;
			const links = group.links
				.map((item) => {
					const label = t.footer.links[item.key] ?? item.key;
					return `<a href="${resolveHref(basePath, item.href)}">${label}</a>`;
				})
				.join('');
			return `
				<div class="site-footer-group">
					<h2>${title}</h2>
					<nav class="site-footer-nav" aria-label="${title}">${links}</nav>
				</div>
			`;
		}).join('');

		this.innerHTML = `
			<footer class="site-footer">
				<div class="site-footer-inner">
					<div class="site-footer-brand-block">
						<p class="site-footer-text">${t.brand}</p>
						<p class="site-footer-description">${t.footer.description}</p>
					</div>
					<div class="site-footer-links-grid">${footerGroups}</div>
				</div>
			</footer>
		`;
	}
}

customElements.define('open-collections-site-header', OpenCollectionsSiteHeader);
customElements.define('open-collections-site-footer', OpenCollectionsSiteFooter);
