export function createConnectionsContext(initialState = {}) {
	let state = {
		// Legacy compatibility field. Prefer selectedConnectionFilterId for
		// view-filter semantics (not a single global active connection gate).
		activeConnectionId: "all",
		selectedConnectionFilterId: "all",
		connections: [],
		...initialState,
	};

	const listeners = new Set();

	function emit() {
		for (const listener of listeners) {
			listener(state);
		}
	}

	return {
		getState() {
			return state;
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		setConnections(connections = []) {
			state = {
				...state,
				connections: Array.isArray(connections) ? [...connections] : [],
			};
			emit();
		},
		setActiveConnection(connectionId) {
			const nextConnectionId = String(connectionId || "all");
			state = {
				...state,
				// Keep both fields in sync while activeConnectionId is still used by
				// older call sites.
				activeConnectionId: nextConnectionId,
				selectedConnectionFilterId: nextConnectionId,
			};
			emit();
		},
		setConnectionFilter(connectionId) {
			const nextConnectionId = String(connectionId || "all");
			state = {
				...state,
				selectedConnectionFilterId: nextConnectionId,
				activeConnectionId: nextConnectionId,
			};
			emit();
		},
	};
}
