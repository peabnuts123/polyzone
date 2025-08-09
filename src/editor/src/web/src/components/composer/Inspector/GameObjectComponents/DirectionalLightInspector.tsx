import { observer } from "mobx-react-lite";

import type { DirectionalLightComponentData } from "@lib/project/data";
import { SetGameObjectLightComponentColorMutation, SetGameObjectLightComponentIntensityMutation } from "@lib/mutation/SceneView/mutations";
import { ColorInput, NumberInput } from "@app/components/common/inputs";
import type { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";

export const DirectionalLightInspector: InspectorComponent<DirectionalLightComponentData> = observer(({ component, controller, gameObject }) => {
  return (
    <InspectorComponentBase component={component} controller={controller} gameObject={gameObject}>
      <ColorInput
        label="Color"
        color={component.color}
        onChange={(newValue) => void controller.mutator.debounceContinuous(
          SetGameObjectLightComponentColorMutation,
          gameObject,
          () => new SetGameObjectLightComponentColorMutation(gameObject, component),
          () => ({ color: newValue }),
        )}
      />

      <NumberInput
        label="Intensity"
        value={component.intensity}
        incrementInterval={0.1}
        onChange={(newValue) => void controller.mutator.debounceContinuous(
          SetGameObjectLightComponentIntensityMutation,
          gameObject,
          () => new SetGameObjectLightComponentIntensityMutation(gameObject, component),
          () => ({ intensity: newValue }),
        )}
      />
    </InspectorComponentBase>
  );
});
