(function () {
	'use strict';

	const mounts = document.querySelectorAll('.open-collections-manager-mount');
	if (!mounts.length) {
		return;
	}

	const pluginConfig = window.OpenCollectionsPluginConfig || {};
	const defaults = pluginConfig.defaults || {};

	const parseJson = (value) => {
		if (!value) {
			return {};
		}
		try {
			return JSON.parse(value);
		} catch (err) {
			return {};
		}
	};

	const buildMountConfig = (mount) => {
		const datasetConfig = parseJson(mount.getAttribute('data-ocp-config'));
		return Object.assign({}, defaults, datasetConfig);
	};

	const renderMountedComponent = (mount, config) => {
		const element = document.createElement('timemap-collector');
		// Handoff contract placeholder: component can later consume this JSON directly.
		element.setAttribute('data-ocp-config', JSON.stringify(config));
		mount.innerHTML = '';
		mount.appendChild(element);
	};

	const mountAll = () => {
		mounts.forEach((mount) => {
			renderMountedComponent(mount, buildMountConfig(mount));
		});
	};

	if (window.customElements && window.customElements.get('timemap-collector')) {
		mountAll();
		return;
	}

	const scriptUrl = pluginConfig.componentScriptUrl;
	if (!scriptUrl) {
		return;
	}

	const scriptTag = document.createElement('script');
	scriptTag.type = 'module';
	scriptTag.src = scriptUrl;
	scriptTag.onload = mountAll;
	scriptTag.onerror = () => {
		mounts.forEach((mount) => {
			mount.innerHTML = '<p>Collection Manager script failed to load. Check Open Collections plugin settings.</p>';
		});
	};
	document.head.appendChild(scriptTag);
})();
