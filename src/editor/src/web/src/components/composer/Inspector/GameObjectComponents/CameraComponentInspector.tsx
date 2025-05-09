import { observer } from "mobx-react-lite";

import type { CameraComponentData } from "@lib/project/data";
import type { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";

export const CameraComponentInspector: InspectorComponent<CameraComponentData> = observer(({ component, controller, gameObject }) => {
  return (
    <InspectorComponentBase component={component} controller={controller} gameObject={gameObject}>
      <label>
        <p className="italic">I am a camera! *takes photo of nearby tree*</p>
      </label>
    </InspectorComponentBase>
  );
});
