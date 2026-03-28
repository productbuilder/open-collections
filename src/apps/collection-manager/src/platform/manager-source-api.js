import { getPlatform } from "../../../../shared/platform/index.js";
import {
	pickHostDirectory,
	supportsHostDirectoryPicker,
} from "../../../../shared/platform/host-directory.js";

const platform = getPlatform();

export function supportsLocalHostDirectoryPicker() {
	return supportsHostDirectoryPicker();
}

export async function pickLocalHostDirectory() {
	return pickHostDirectory();
}

export async function subscribeToManagerFileDrops(listener) {
	return platform.subscribeToFileDrops(listener);
}

export async function pickManagerImageFiles({ multiple = true } = {}) {
	if (typeof platform.pickImageFiles !== "function") {
		throw new Error(
			"Image picking is not supported on this platform adapter.",
		);
	}
	const files = await platform.pickImageFiles({ multiple });
	return Array.isArray(files) ? files : [];
}

export async function pickManagerDocumentFiles({ multiple = false } = {}) {
	if (typeof platform.pickDocumentFiles !== "function") {
		throw new Error(
			"Document picking is not supported on this platform adapter.",
		);
	}
	const files = await platform.pickDocumentFiles({ multiple });
	return Array.isArray(files) ? files : [];
}
