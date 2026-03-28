(function () {
	"use strict";

	const mounts = document.querySelectorAll(".open-collections-manager-mount");
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
		const datasetConfig = parseJson(mount.getAttribute("data-ocp-config"));
		return Object.assign({}, defaults, datasetConfig);
	};

	const tryLegacyMount = (mount, config) => {
		if (
			window.CollectionManager &&
			typeof window.CollectionManager.mount === "function"
		) {
			window.CollectionManager.mount(mount, config);
			return true;
		}
		return false;
	};

	const renderMountedComponent = (mount, config) => {
		if (tryLegacyMount(mount, config)) {
			return;
		}

		if (
			!window.customElements ||
			!window.customElements.get("open-collections-manager")
		) {
			mount.innerHTML = "";
			const pre = document.createElement("pre");
			pre.className = "open-collections-config-preview";
			pre.textContent =
				"Collection Manager component is not available.\n" +
				"Set a valid component script URL or expose window.CollectionManager.mount(root, config).\n\n" +
				JSON.stringify(config, null, 2);
			mount.appendChild(pre);
			return;
		}

		const element = document.createElement("open-collections-manager");
		// Handoff contract placeholder: component can consume this JSON directly.
		element.setAttribute("data-ocp-config", JSON.stringify(config));
		mount.innerHTML = "";
		mount.appendChild(element);
	};

	const mountAll = () => {
		mounts.forEach((mount) => {
			renderMountedComponent(mount, buildMountConfig(mount));
		});
	};

	if (
		window.customElements &&
		window.customElements.get("open-collections-manager")
	) {
		mountAll();
		return;
	}

	const scriptUrl = pluginConfig.componentScriptUrl;
	if (!scriptUrl) {
		return;
	}

	const scriptTag = document.createElement("script");
	scriptTag.type = "module";
	scriptTag.src = scriptUrl;
	scriptTag.onload = mountAll;
	scriptTag.onerror = () => {
		const fallbackScript = document.createElement("script");
		fallbackScript.src = scriptUrl;
		fallbackScript.onload = mountAll;
		fallbackScript.onerror = () => {
			mounts.forEach((mount) => {
				mount.innerHTML =
					"<p>Collection Manager script failed to load. Check Open Collections plugin settings.</p>";
			});
		};
		document.head.appendChild(fallbackScript);
	};
	document.head.appendChild(scriptTag);
})();
