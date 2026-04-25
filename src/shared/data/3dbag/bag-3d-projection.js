const RD_X0 = 155000;
const RD_Y0 = 463000;

export function rdToWgs84Approx(rdx, rdy) {
	const x = (Number(rdx) - RD_X0) / 100000;
	const y = (Number(rdy) - RD_Y0) / 100000;
	if (![x, y].every(Number.isFinite)) {
		throw new TypeError("rdx and rdy must be finite numbers.");
	}

	const lat =
		52.1551744 +
		(3235.65389 * y +
			-32.58297 * x ** 2 +
			-0.2475 * y ** 2 +
			-0.84978 * x ** 2 * y +
			-0.0655 * y ** 3 +
			-0.01709 * x ** 2 * y ** 2 +
			-0.00738 * x +
			0.0053 * x ** 4 +
			-0.00039 * x ** 2 * y ** 3 +
			0.00033 * x ** 4 * y +
			-0.00012 * x * y) /
			3600;

	const lng =
		5.38720621 +
		(5260.52916 * x +
			105.94684 * x * y +
			2.45656 * x * y ** 2 +
			-0.81885 * x ** 3 +
			0.05594 * x * y ** 3 +
			-0.05607 * x ** 3 * y +
			0.01199 * y +
			-0.00256 * x ** 3 * y ** 2 +
			0.00128 * x * y ** 4 +
			0.00022 * y ** 2 +
			-0.00022 * x ** 2 +
			0.00026 * x ** 5) /
			3600;

	return { lng, lat };
}

export function wgs84BboxAroundRdPoint(rdx, rdy, spanMeters = 800) {
	const center = rdToWgs84Approx(rdx, rdy);
	const meters = Math.max(20, Number(spanMeters) || 20);
	const latDelta = meters / 111320;
	const lngScale = Math.cos((center.lat * Math.PI) / 180) || 1;
	const lngDelta = meters / (111320 * Math.max(0.2, Math.abs(lngScale)));
	return [
		center.lng - lngDelta,
		center.lat - latDelta,
		center.lng + lngDelta,
		center.lat + latDelta,
	];
}
