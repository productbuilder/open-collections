const NAV_ITEMS = [
	{ key: 'home', label: 'Home', href: '' },
	{ key: 'tools', label: 'Tools', href: 'site/tools/' },
	{ key: 'get-started', label: 'Get started', href: 'site/get-started/' },
	{ key: 'hosting', label: 'Hosting', href: 'site/hosting/' },
	{ key: 'docs', label: 'Docs', href: 'site/docs/' },
];

const FOOTER_LINKS = [
	{ label: 'Home', href: '' },
	{ label: 'Tools', href: 'site/tools/' },
	{ label: 'Get started', href: 'site/get-started/' },
	{ label: 'Hosting', href: 'site/hosting/' },
	{ label: 'Docs', href: 'site/docs/' },
];

const toBasePath = (value) => {
	if (!value) {
		return './';
	}
	return value.endsWith('/') ? value : `${value}/`;
};

class OpenCollectionsSiteHeader extends HTMLElement {
	connectedCallback() {
		const basePath = toBasePath(this.getAttribute('base-path'));
		const activePage = this.getAttribute('active-page');

		const navLinks = NAV_ITEMS.map((item) => {
			const isActive = item.key === activePage;
			const classes = isActive ? ' class="is-active"' : '';
			const currentPage = isActive ? ' aria-current="page"' : '';
			return `<a href="${basePath}${item.href}"${classes}${currentPage}>${item.label}</a>`;
		}).join('');

		this.innerHTML = `
			<div class="site-header">
				<div class="site-header-inner">
					<div class="site-brand">Open Collections</div>
					<nav class="site-nav" aria-label="Primary navigation">${navLinks}</nav>
				</div>
			</div>
		`;
	}
}

class OpenCollectionsSiteFooter extends HTMLElement {
	connectedCallback() {
		const basePath = toBasePath(this.getAttribute('base-path'));
		const footerLinks = FOOTER_LINKS.map((item) => `<a href="${basePath}${item.href}">${item.label}</a>`).join('');

		this.innerHTML = `
			<footer class="site-footer">
				<div class="site-footer-inner">
					<p class="site-footer-text">Open Collections</p>
					<nav class="site-footer-nav" aria-label="Footer navigation">${footerLinks}</nav>
				</div>
			</footer>
		`;
	}
}

customElements.define('open-collections-site-header', OpenCollectionsSiteHeader);
customElements.define('open-collections-site-footer', OpenCollectionsSiteFooter);
