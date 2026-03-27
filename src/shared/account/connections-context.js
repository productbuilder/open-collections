export function createConnectionsContext(initialState = {}) {
  let state = {
    activeConnectionId: 'all',
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
      state = {
        ...state,
        activeConnectionId: String(connectionId || 'all'),
      };
      emit();
    },
  };
}
