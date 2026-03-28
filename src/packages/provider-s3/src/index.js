import {
	PROVIDER_AVAILABILITY,
	READ_ONLY_CAPABILITIES,
	createProviderDescriptor,
	providerNotConnectedError,
} from "../../provider-core/src/provider.js";

function normalizePrefix(value = "") {
	return String(value || "")
		.trim()
		.replace(/^\/+/, "")
		.replace(/\/+$/, "");
}

function normalizeEndpoint(value = "") {
	return String(value || "")
		.trim()
		.replace(/\/+$/, "");
}

function joinKey(...parts) {
	return parts
		.map((part) => String(part || "").trim())
		.filter(Boolean)
		.map((part) => part.replace(/^\/+/, "").replace(/\/+$/, ""))
		.filter(Boolean)
		.join("/");
}

function encodeS3Path(path = "") {
	return String(path || "")
		.split("/")
		.filter((segment) => segment.length > 0)
		.map((segment) =>
			encodeURIComponent(segment).replace(
				/[!'()*]/g,
				(ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`,
			),
		)
		.join("/");
}

function formatAmzDate(date = new Date()) {
	const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
	return {
		amzDate: iso,
		shortDate: iso.slice(0, 8),
	};
}

function toHex(buffer) {
	return Array.from(new Uint8Array(buffer))
		.map((value) => value.toString(16).padStart(2, "0"))
		.join("");
}

async function sha256Hex(data) {
	const encoder = new TextEncoder();
	const bytes =
		data instanceof Uint8Array ? data : encoder.encode(String(data || ""));
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return toHex(digest);
}

async function hmacSha256Raw(keyBytes, data) {
	const encoder = new TextEncoder();
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		keyBytes,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	return new Uint8Array(
		await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data)),
	);
}

async function signingKey(secretKey, shortDate, region, service = "s3") {
	const encoder = new TextEncoder();
	const kDate = await hmacSha256Raw(
		encoder.encode(`AWS4${secretKey}`),
		shortDate,
	);
	const kRegion = await hmacSha256Raw(kDate, region || "us-east-1");
	const kService = await hmacSha256Raw(kRegion, service);
	return hmacSha256Raw(kService, "aws4_request");
}

function parseS3ErrorXml(text = "") {
	const code = text.match(/<Code>([^<]+)<\/Code>/i)?.[1] || "";
	const message = text.match(/<Message>([^<]+)<\/Message>/i)?.[1] || "";
	return { code, message };
}

async function buildPayloadHash(body) {
	if (body == null) {
		return sha256Hex("");
	}
	if (typeof body === "string") {
		return sha256Hex(body);
	}
	if (body instanceof Blob) {
		return sha256Hex(new Uint8Array(await body.arrayBuffer()));
	}
	if (body instanceof Uint8Array) {
		return sha256Hex(body);
	}
	return sha256Hex(String(body));
}

function s3Capabilities({
	configured = false,
	connected = false,
	credentialsPresent = false,
} = {}) {
	const canPublish = Boolean(configured && connected && credentialsPresent);
	return {
		...READ_ONLY_CAPABILITIES,
		canRead: false,
		canWrite: canPublish,
		canPublish,
		canStoreAssets: canPublish,
		canStoreManifest: canPublish,
		requiresCredentials: true,
		supportsReconnect: true,
		supportsPull: false,
		supportsPush: canPublish,
		canConfigure: configured,
		hasCredentials: credentialsPresent,
		connectionReady: connected,
	};
}

export function createS3Provider() {
	let connected = false;
	let configState = {
		endpoint: "",
		bucket: "",
		region: "",
		basePath: "",
		accessKey: "",
		secretKey: "",
	};

	let capabilities = s3Capabilities();

	const descriptor = createProviderDescriptor({
		id: "s3",
		label: "S3-compatible storage",
		category: "external",
		availability: PROVIDER_AVAILABILITY.experimental,
		description:
			"Configure an S3-compatible object storage host as a publish target.",
		statusLabel: "Publish capable",
		capabilities,
	});

	async function signedFetch({
		method = "GET",
		objectKey = "",
		query = {},
		headers = {},
		body = null,
	} = {}) {
		const endpointUrl = new URL(configState.endpoint);
		const host = endpointUrl.host;
		const region = configState.region || "us-east-1";
		const encodedBucket = encodeS3Path(configState.bucket);
		const encodedObjectKey = encodeS3Path(objectKey);
		const canonicalUri = encodedObjectKey
			? `/${encodedBucket}/${encodedObjectKey}`
			: `/${encodedBucket}`;

		const queryEntries = Object.entries(query)
			.filter(([, value]) => value !== undefined && value !== null)
			.map(([key, value]) => [
				encodeURIComponent(key),
				encodeURIComponent(String(value)),
			])
			.sort(([a], [b]) => a.localeCompare(b));
		const canonicalQuery = queryEntries
			.map(([key, value]) => `${key}=${value}`)
			.join("&");

		const { amzDate, shortDate } = formatAmzDate();
		const payloadHash = await buildPayloadHash(body);

		const requestHeaders = {
			host,
			"x-amz-content-sha256": payloadHash,
			"x-amz-date": amzDate,
			...headers,
		};

		const signedHeaders = Object.keys(requestHeaders)
			.map((name) => name.toLowerCase())
			.sort();
		const canonicalHeaders = signedHeaders
			.map(
				(name) =>
					`${name}:${String(requestHeaders[name] || requestHeaders[name.toUpperCase()] || "").trim()}\n`,
			)
			.join("");

		const canonicalRequest = [
			method.toUpperCase(),
			canonicalUri,
			canonicalQuery,
			canonicalHeaders,
			signedHeaders.join(";"),
			payloadHash,
		].join("\n");

		const credentialScope = `${shortDate}/${region}/s3/aws4_request`;
		const stringToSign = [
			"AWS4-HMAC-SHA256",
			amzDate,
			credentialScope,
			await sha256Hex(canonicalRequest),
		].join("\n");
		const key = await signingKey(
			configState.secretKey,
			shortDate,
			region,
			"s3",
		);
		const signature = toHex(await hmacSha256Raw(key, stringToSign));

		const authorization =
			`AWS4-HMAC-SHA256 Credential=${configState.accessKey}/${credentialScope}, ` +
			`SignedHeaders=${signedHeaders.join(";")}, Signature=${signature}`;

		const requestUrl = `${configState.endpoint}${canonicalUri}${canonicalQuery ? `?${canonicalQuery}` : ""}`;

		return fetch(requestUrl, {
			method,
			headers: {
				...requestHeaders,
				Authorization: authorization,
			},
			body,
		});
	}

	async function validateConnection() {
		try {
			const response = await signedFetch({
				method: "GET",
				query: {
					"list-type": 2,
					"max-keys": 1,
					prefix: configState.basePath || undefined,
				},
			});
			if (response.ok) {
				return;
			}

			const responseText = await response.text();
			const { message } = parseS3ErrorXml(responseText);
			if (response.status === 403 || response.status === 401) {
				throw new Error(
					`S3 connection failed: credentials are invalid or do not have access to bucket ${configState.bucket}. ${message}`.trim(),
				);
			}
			if (response.status === 404) {
				throw new Error(
					`S3 connection failed: bucket ${configState.bucket} was not found at ${configState.endpoint}.`,
				);
			}
			throw new Error(
				`S3 connection failed (${response.status}): ${message || "Unable to validate endpoint/bucket configuration."}`,
			);
		} catch (error) {
			if (error instanceof TypeError) {
				throw new Error(
					`S3 connection failed: could not reach ${configState.endpoint}. Check endpoint URL, CORS policy, and network access.`,
				);
			}
			throw error;
		}
	}

	return {
		...descriptor,

		getDescriptor() {
			return descriptor;
		},

		async connect(config = {}) {
			configState = {
				endpoint: normalizeEndpoint(config.endpoint),
				bucket: String(config.bucket || "").trim(),
				region: String(config.region || "").trim(),
				basePath: normalizePrefix(config.basePath),
				accessKey: String(config.accessKey || "").trim(),
				secretKey: config.secretKey || "",
			};

			const configured = Boolean(
				configState.endpoint && configState.bucket,
			);
			const credentialsPresent = Boolean(
				configState.accessKey && configState.secretKey,
			);

			if (!configured) {
				connected = false;
				capabilities = s3Capabilities({
					configured,
					connected,
					credentialsPresent,
				});
				return {
					ok: false,
					message:
						"Enter endpoint and bucket to configure this S3-compatible host.",
					capabilities,
				};
			}

			if (!credentialsPresent) {
				connected = false;
				capabilities = s3Capabilities({
					configured,
					connected,
					credentialsPresent,
				});
				return {
					ok: false,
					message:
						"Credentials are required. Add access key and secret key to reconnect this host.",
					capabilities,
				};
			}

			await validateConnection();

			connected = true;
			capabilities = s3Capabilities({
				configured,
				connected,
				credentialsPresent,
			});
			return {
				ok: true,
				message: `Connected to ${configState.bucket} on ${configState.endpoint}. Ready to publish collection manifest and assets.`,
				capabilities,
			};
		},

		async listAssets() {
			if (!connected) {
				throw providerNotConnectedError("s3");
			}
			return [];
		},

		async getAsset() {
			if (!connected) {
				throw providerNotConnectedError("s3");
			}
			return null;
		},

		async saveMetadata() {
			throw new Error("S3 metadata save is not implemented yet.");
		},

		async exportCollection(collectionMeta) {
			if (!connected) {
				throw providerNotConnectedError("s3");
			}

			return {
				id: collectionMeta.id,
				title: collectionMeta.title,
				description: collectionMeta.description,
				items: [],
			};
		},

		async publishCollection(payload = {}) {
			if (!connected) {
				throw providerNotConnectedError("s3");
			}

			if (!configState.accessKey || !configState.secretKey) {
				throw new Error(
					"Publish failed: credentials are missing. Reconnect this S3 host and provide access key + secret key.",
				);
			}

			const manifest = payload.manifest;
			if (
				!manifest ||
				typeof manifest !== "object" ||
				!Array.isArray(manifest.items)
			) {
				throw new Error("Publish failed: manifest payload is invalid.");
			}

			const uploads = Array.isArray(payload.uploads)
				? payload.uploads
				: [];
			const uploaded = [];
			for (const entry of uploads) {
				const relativePath = String(entry?.path || "").trim();
				const blob = entry?.blob || null;
				if (!relativePath || !blob) {
					continue;
				}

				const objectKey = joinKey(configState.basePath, relativePath);
				const response = await signedFetch({
					method: "PUT",
					objectKey,
					headers: {
						"content-type": blob.type || "application/octet-stream",
					},
					body: blob,
				});

				if (!response.ok) {
					const responseText = await response.text();
					const { message } = parseS3ErrorXml(responseText);
					throw new Error(
						`Publish failed while uploading ${relativePath}: ${message || `S3 returned ${response.status}.`}`,
					);
				}

				uploaded.push({
					path: objectKey,
					bucket: configState.bucket,
				});
			}

			const collectionRootPath = joinKey(
				payload.collectionRootPath || "",
			);
			const manifestKey = joinKey(
				configState.basePath,
				collectionRootPath,
				"collection.json",
			);
			const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
			const manifestResponse = await signedFetch({
				method: "PUT",
				objectKey: manifestKey,
				headers: {
					"content-type": "application/json",
				},
				body: serialized,
			});

			if (!manifestResponse.ok) {
				const responseText = await manifestResponse.text();
				const { message } = parseS3ErrorXml(responseText);
				throw new Error(
					`Publish failed while writing collection.json: ${message || `S3 returned ${manifestResponse.status}.`}`,
				);
			}

			return {
				ok: true,
				manifestPath: manifestKey,
				uploaded,
				itemCount: manifest.items.length,
			};
		},

		getCapabilities() {
			return capabilities;
		},
	};
}
