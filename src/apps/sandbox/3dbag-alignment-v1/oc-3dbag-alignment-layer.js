import { Oc3DBagLayerElement } from "./oc-3dbag-layer.js";

if (!customElements.get("oc-3dbag-alignment-layer")) {
	customElements.define("oc-3dbag-alignment-layer", Oc3DBagLayerElement);
}

export { Oc3DBagLayerElement as Oc3DBagAlignmentLayerElement };
