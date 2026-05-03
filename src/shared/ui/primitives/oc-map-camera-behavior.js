const DEFAULT_ZOOM_PITCH_STOPS = [
	{ zoom: 8, pitch: 0 },
	{ zoom: 10, pitch: 20 },
	{ zoom: 12.5, pitch: 70 },
	{ zoom: 16, pitch: 75 },
];

const DEFAULT_DURATION = 120;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toFiniteNumber = (value) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

export const parseZoomPitchStops = (rawStops) => {
	if (typeof rawStops !== "string" || !rawStops.trim()) {
		return [...DEFAULT_ZOOM_PITCH_STOPS];
	}

	const stops = rawStops
		.split(",")
		.map((segment) => segment.trim())
		.filter(Boolean)
		.map((segment) => {
			const [zoomRaw, pitchRaw] = segment.split(":").map((part) => part.trim());
			const zoom = toFiniteNumber(zoomRaw);
			const pitch = toFiniteNumber(pitchRaw);
			if (zoom === null || pitch === null) {
				return null;
			}
			return { zoom, pitch };
		})
		.filter(Boolean)
		.sort((a, b) => a.zoom - b.zoom);

	if (!stops.length) {
		return [...DEFAULT_ZOOM_PITCH_STOPS];
	}

	return stops;
};

const interpolatePitchByZoom = (zoom, stops) => {
	if (!Number.isFinite(zoom) || !Array.isArray(stops) || !stops.length) {
		return 0;
	}

	if (stops.length === 1) {
		return stops[0].pitch;
	}

	if (zoom <= stops[0].zoom) {
		return stops[0].pitch;
	}

	for (let index = 1; index < stops.length; index += 1) {
		const start = stops[index - 1];
		const end = stops[index];
		if (zoom <= end.zoom) {
			const span = end.zoom - start.zoom;
			if (span <= 0) {
				return end.pitch;
			}
			const progress = (zoom - start.zoom) / span;
			return start.pitch + (end.pitch - start.pitch) * progress;
		}
	}

	return stops[stops.length - 1].pitch;
};

export class OcMapCameraBehaviorController {
	constructor(map, options = {}) {
		this._map = map;
		this._options = this._normalizeOptions(options);
		this._connected = false;
		this._rafId = null;
		this._lastAppliedPitch = null;
		this._isApplyingPitch = false;
		this._isPinching = false;
		this._pendingPitchAfterPinch = false;
		this._gestureSurface = null;

		this._boundScheduleUpdate = this._scheduleUpdate.bind(this);
		this._boundCancelApplyFlag = this._cancelApplyFlag.bind(this);
		this._boundHandleTouchStart = this._handleTouchStart.bind(this);
		this._boundHandleTouchMove = this._handleTouchMove.bind(this);
		this._boundHandleTouchEnd = this._handleTouchEnd.bind(this);
	}

	connect() {
		if (!this._map || this._connected || this._options.behavior !== "zoom-pitch") {
			return;
		}
		this._connected = true;
		this._bindGestureListeners();
		this._map.on("move", this._boundScheduleUpdate);
		this._map.on("zoom", this._boundScheduleUpdate);
		this._map.on("pitch", this._boundCancelApplyFlag);
		this._scheduleUpdate();
	}

	disconnect() {
		if (!this._map || !this._connected) {
			return;
		}
		this._connected = false;
		this._unbindGestureListeners();
		this._map.off("move", this._boundScheduleUpdate);
		this._map.off("zoom", this._boundScheduleUpdate);
		this._map.off("pitch", this._boundCancelApplyFlag);
		if (this._rafId !== null) {
			cancelAnimationFrame(this._rafId);
			this._rafId = null;
		}
	}

	updateOptions(options = {}) {
		this._options = this._normalizeOptions({
			...this._options,
			...options,
		});
		this._lastAppliedPitch = null;
		if (!this._map) {
			return;
		}
		if (this._options.behavior === "zoom-pitch") {
			if (!this._connected) {
				this.connect();
				return;
			}
			this._scheduleUpdate();
			return;
		}
		this.disconnect();
	}

	_normalizeOptions(options) {
		const stops = parseZoomPitchStops(options.zoomPitchStops);
		const duration = toFiniteNumber(options.duration);
		return {
			behavior: typeof options.behavior === "string" ? options.behavior : null,
			zoomPitchStops: stops,
			duration: duration === null ? DEFAULT_DURATION : Math.max(0, duration),
		};
	}

	_scheduleUpdate() {
		if (!this._connected || this._rafId !== null) {
			return;
		}
		this._rafId = requestAnimationFrame(() => {
			this._rafId = null;
			this._applyPitchForZoom();
		});
	}

	_applyPitchForZoom() {
		if (!this._map || !this._connected || this._isApplyingPitch) {
			return;
		}
		if (this._isPinching) {
			this._pendingPitchAfterPinch = true;
			return;
		}
		const target = interpolatePitchByZoom(
			this._map.getZoom(),
			this._options.zoomPitchStops,
		);
		const maxPitch = this._resolveMaxPitch();
		const clampedTarget = clamp(target, 0, maxPitch);
		if (
			this._lastAppliedPitch !== null &&
			Math.abs(clampedTarget - this._lastAppliedPitch) < 0.05
		) {
			return;
		}

		this._isApplyingPitch = true;
		this._lastAppliedPitch = clampedTarget;
		this._map.setPitch(clampedTarget);
		requestAnimationFrame(this._boundCancelApplyFlag);
	}

	_bindGestureListeners() {
		const canvasContainer = this._map?.getCanvasContainer?.();
		if (!canvasContainer) {
			return;
		}
		this._gestureSurface = canvasContainer;
		this._gestureSurface.addEventListener("touchstart", this._boundHandleTouchStart, {
			passive: true,
		});
		this._gestureSurface.addEventListener("touchmove", this._boundHandleTouchMove, {
			passive: true,
		});
		this._gestureSurface.addEventListener("touchend", this._boundHandleTouchEnd, {
			passive: true,
		});
		this._gestureSurface.addEventListener("touchcancel", this._boundHandleTouchEnd, {
			passive: true,
		});
	}

	_unbindGestureListeners() {
		if (!this._gestureSurface) {
			return;
		}
		this._gestureSurface.removeEventListener("touchstart", this._boundHandleTouchStart);
		this._gestureSurface.removeEventListener("touchmove", this._boundHandleTouchMove);
		this._gestureSurface.removeEventListener("touchend", this._boundHandleTouchEnd);
		this._gestureSurface.removeEventListener("touchcancel", this._boundHandleTouchEnd);
		this._gestureSurface = null;
		this._isPinching = false;
		this._pendingPitchAfterPinch = false;
	}

	_handleTouchStart(event) {
		if (event.touches?.length >= 2) {
			this._isPinching = true;
		}
	}

	_handleTouchMove(event) {
		if (event.touches?.length >= 2) {
			this._isPinching = true;
		}
	}

	_handleTouchEnd(event) {
		const touchCount = event.touches?.length ?? 0;
		if (touchCount >= 2) {
			return;
		}
		const wasPinching = this._isPinching;
		this._isPinching = false;
		if (wasPinching && this._pendingPitchAfterPinch) {
			this._pendingPitchAfterPinch = false;
			this._scheduleUpdate();
		}
	}

	_resolveMaxPitch() {
		const mapLimit = toFiniteNumber(this._map?.getMaxPitch?.());
		if (mapLimit === null) {
			return 85;
		}
		return clamp(mapLimit, 0, 85);
	}

	_cancelApplyFlag() {
		this._isApplyingPitch = false;
	}
}
