export function makeConnectionId(providerId) {
	return `${providerId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
