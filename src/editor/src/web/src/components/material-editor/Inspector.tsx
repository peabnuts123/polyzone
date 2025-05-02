import { useRef, type FunctionComponent } from "react";
import { observer } from "mobx-react-lite";

import { RetroMaterial } from "@polyzone/runtime/src/materials/RetroMaterial";
import { toColor3Core } from "@polyzone/runtime/src/util";

import { ModelMaterialEditorController } from "@lib/material-editor/model/ModelMaterialEditorController";
import { MeshAssetMaterialOverrideData } from "@lib/project/data";
import { SetModelMaterialOverrideDiffuseColorEnabledMutation, SetModelMaterialOverrideDiffuseColorMutation } from "@lib/mutation/asset/mutations";
import { ColorInput } from "../common/inputs";

interface Props {
  modelMaterialEditorController: ModelMaterialEditorController;
}

export const Inspector: FunctionComponent<Props> = observer(({ modelMaterialEditorController: controller }) => {
  // Refs
  const outerContainerRef = useRef<HTMLDivElement>(null);

  // Computed state
  const selectedMaterialName = controller.selectedMaterialName;

  const isAnyMaterialSelected = selectedMaterialName !== undefined;
  const isNoMaterialSelected = selectedMaterialName === undefined;

  let overrideData: MeshAssetMaterialOverrideData | undefined;
  if (isAnyMaterialSelected) {
    overrideData = controller.model.getOverridesForMaterial(selectedMaterialName!);
  }

  const currentColor = toColor3Core(overrideData?.diffuseColor || RetroMaterial.Defaults.diffuseColor);
  const currentColorEnabled = overrideData?.diffuseColorEnabled || false;

  return (
    <>
      <div className="p-2 bg-gradient-to-b from-[blue] to-pink-500 text-white text-retro-shadow shrink-0">
        <h2 className="text-lg">Inspector</h2>
      </div>
      <div className="bg-slate-300 h-full overflow-y-scroll grow" ref={outerContainerRef}>
        {/* No object selected */}
        {isNoMaterialSelected && (
          <div className="p-2">
            <p className="italic">No material selected</p>
          </div>
        )}

        {/* At least 1 object selected */}
        {isAnyMaterialSelected && (
          <>
            <div className="p-2">
              {/* Name */}
              <div className="text-xl">{selectedMaterialName}</div>

              {/* @TODO Material picker */}

              <h2 className="text-h2 mb-2">Overrides</h2>

              <ColorInput togglable
                label="Color"
                color={currentColor}
                enabled={currentColorEnabled}
                containerRef={outerContainerRef}
                onEnabledChange={(newValue) => {
                  controller.mutator.apply(new SetModelMaterialOverrideDiffuseColorEnabledMutation(controller.model.id, selectedMaterialName, newValue));
                }}
                onColorChange={(newValue) => controller.mutator.debounceContinuous(
                  SetModelMaterialOverrideDiffuseColorMutation,
                  controller.model,
                  () => new SetModelMaterialOverrideDiffuseColorMutation(controller.model.id, selectedMaterialName),
                  () => ({ diffuseColor: newValue }),
                )}
              />

              {/* @TODO Texture */}

              {/* @TODO Reflection per type */}

              {/* @TODO Emission color */}

            </div>
          </>
        )}
      </div>
    </>
  );
});
