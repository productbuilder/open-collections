import test from "node:test";
import assert from "node:assert/strict";

import { createStructuredDiagnostics } from "./diagnostics-model.js";

test("creates consistent structured diagnostics shape", () => {
	const diagnostics = createStructuredDiagnostics({
		kind: "list-adapter",
		counts: {
			sources: 2,
			collections: 3,
			items: 10,
			includedItems: 8,
			georeferencedItems: 4,
			temporalItems: 5,
			filtered: {
				sources: 1,
				collections: 2,
				items: 3,
			},
			projected: {
				list: 6,
				map: 3,
			},
		},
		fetch: {
			requestCount: 9,
			networkCount: 7,
			dedupHitCount: 2,
		},
		normalization: {
			count: 4,
		},
		warnings: [{ code: "w", message: "warn" }],
		failures: [{ code: "f", message: "fail" }],
		projection: {
			count: 6,
			listCount: 6,
			mapCount: 3,
			viewportFilteredCount: 1,
		},
		timing: {
			totalMs: 12.25,
			listProjectionMs: 3.5,
		},
	});
	assert.equal(diagnostics.modelVersion, "browser-diagnostics-v1");
	assert.equal(diagnostics.kind, "list-adapter");
	assert.equal(diagnostics.counts.sources, 2);
	assert.equal(diagnostics.counts.filtered.items, 3);
	assert.equal(diagnostics.fetch.dedupHitCount, 2);
	assert.equal(diagnostics.warnings.count, 1);
	assert.equal(diagnostics.failures.count, 1);
	assert.equal(diagnostics.projection.viewportFilteredCount, 1);
	assert.equal(diagnostics.timing.listProjectionMs, 3.5);
});

