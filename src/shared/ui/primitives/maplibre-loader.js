const MAPLIBRE_VERSION = "5.9.0";
const MAPLIBRE_SCRIPT_ID = "oc-maplibre-js";
const MAPLIBRE_STYLE_ID = "oc-maplibre-css";
const MAPLIBRE_GLOBAL_NAME = "maplibregl";

const MAPLIBRE_JS_URL = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`;
const MAPLIBRE_CSS_URL = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`;

let mapLibreLoadPromise = null;

function ensureMapLibreCss(doc = document) {
	if (doc.getElementById(MAPLIBRE_STYLE_ID)) {
		return;
	}

	const link = doc.createElement("link");
	link.id = MAPLIBRE_STYLE_ID;
	link.rel = "stylesheet";
	link.href = MAPLIBRE_CSS_URL;
	doc.head.append(link);
}

function ensureMapLibreScript() {
	const existingScript = document.getElementById(MAPLIBRE_SCRIPT_ID);
	if (existingScript) {
		return existingScript;
	}

	const script = document.createElement("script");
	script.id = MAPLIBRE_SCRIPT_ID;
	script.src = MAPLIBRE_JS_URL;
	script.async = true;
	script.dataset.ocStatus = "loading";
	script.addEventListener("load", () => {
		script.dataset.ocStatus = "loaded";
	});
	script.addEventListener("error", () => {
		script.dataset.ocStatus = "error";
	});
	document.head.append(script);
	return script;
}

function createMapLibreLoaderError(message) {
	const error = new Error(message);
	error.name = "OcMapLoaderError";
	return error;
}

function waitForMapLibreGlobal(script) {
	return new Promise((resolve, reject) => {
		if (window[MAPLIBRE_GLOBAL_NAME]) {
			resolve(window[MAPLIBRE_GLOBAL_NAME]);
			return;
		}

		if (script.dataset.ocStatus === "error") {
			reject(createMapLibreLoaderError(`Failed to load MapLibre script from ${MAPLIBRE_JS_URL}.`));
			return;
		}

		if (script.dataset.ocStatus === "loaded") {
			reject(createMapLibreLoaderError("MapLibre loaded without exposing window.maplibregl."));
			return;
		}

		const cleanup = () => {
			script.removeEventListener("load", onLoad);
			script.removeEventListener("error", onError);
		};

		const onLoad = () => {
			cleanup();
			if (window[MAPLIBRE_GLOBAL_NAME]) {
				resolve(window[MAPLIBRE_GLOBAL_NAME]);
				return;
			}
			reject(createMapLibreLoaderError("MapLibre loaded without exposing window.maplibregl."));
		};

		const onError = () => {
			cleanup();
			reject(createMapLibreLoaderError(`Failed to load MapLibre script from ${MAPLIBRE_JS_URL}.`));
		};

		script.addEventListener("load", onLoad, { once: true });
		script.addEventListener("error", onError, { once: true });
	});
}

export async function loadMapLibreGl() {
	if (window[MAPLIBRE_GLOBAL_NAME]) {
		return window[MAPLIBRE_GLOBAL_NAME];
	}

	if (!mapLibreLoadPromise) {
		mapLibreLoadPromise = (async () => {
			ensureMapLibreCss();
			const script = ensureMapLibreScript();
			return waitForMapLibreGlobal(script);
		})();
	}

	try {
		return await mapLibreLoadPromise;
	} catch (error) {
		mapLibreLoadPromise = null;
		throw error;
	}
}
