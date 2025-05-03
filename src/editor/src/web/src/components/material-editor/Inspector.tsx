import { useRef, type FunctionComponent } from "react";
import { observer } from "mobx-react-lite";

import { RetroMaterial } from "@polyzone/runtime/src/materials/RetroMaterial";
import { toColor3Core } from "@polyzone/runtime/src/util";

import { ModelMaterialEditorController } from "@lib/material-editor/model/ModelMaterialEditorController";
import { MeshAssetMaterialOverrideData, TextureAssetData } from "@lib/project/data";
import { ReflectionSeparateTexture, SetModelMaterialOverrideDiffuseColorEnabledMutation, SetModelMaterialOverrideDiffuseColorMutation, SetModelMaterialOverrideDiffuseTextureEnabledMutation, SetModelMaterialOverrideDiffuseTextureMutation, SetModelMaterialOverrideEmissionColorEnabledMutation, SetModelMaterialOverrideEmissionColorMutation, SetModelMaterialOverrideReflection3x2TextureMutation, SetModelMaterialOverrideReflection6x1TextureMutation, SetModelMaterialOverrideReflectionBoxNetTextureMutation, SetModelMaterialOverrideReflectionEnabledMutation, SetModelMaterialOverrideReflectionSeparateTextureMutation, SetModelMaterialOverrideReflectionStrengthMutation, SetModelMaterialOverrideReflectionTypeMutation } from "@lib/mutation/asset/mutations";
import { ColorInput, createAssetReferenceComponentOfType, NumberInput } from "../common/inputs";
import { AssetType, MeshAssetMaterialOverrideReflectionType } from "@polyzone/runtime/src/cartridge/archive";

const TextureAssetReference = createAssetReferenceComponentOfType<AssetType.Texture>();


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

  const currentDiffuseColorEnabled = overrideData?.diffuseColorEnabled || false;
  const currentDiffuseColor = toColor3Core(overrideData?.diffuseColor || RetroMaterial.Defaults.diffuseColor);
  const currentDiffuseTextureEnabled = overrideData?.diffuseTextureEnabled || false;
  const currentDiffuseTexture = overrideData?.diffuseTexture as TextureAssetData;
  const currentEmissionColorEnabled = overrideData?.emissionColorEnabled || false;
  const currentEmissionColor = toColor3Core(overrideData?.emissionColor || RetroMaterial.Defaults.emissiveColor);


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

              {/* @TODO Material picker */}

              <h2 className="text-h2 mb-2">Overrides</h2>

              {/* Diffuse color */}
              <ColorInput togglable
                label="Color"
                className="mb-3"
                color={currentDiffuseColor}
                enabled={currentDiffuseColorEnabled}
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

              {/* Diffuse texture */}
              <TextureAssetReference togglable
                label="Texture"
                className="mb-3"
                asset={currentDiffuseTexture}
                assetType={AssetType.Texture}
                enabled={currentDiffuseTextureEnabled}
                onEnabledChange={(newValue) => {
                  controller.mutator.apply(new SetModelMaterialOverrideDiffuseTextureEnabledMutation(controller.model.id, selectedMaterialName, newValue));
                }}
                onAssetChange={(newValue) => {
                  controller.mutator.apply(new SetModelMaterialOverrideDiffuseTextureMutation(controller.model.id, selectedMaterialName, newValue?.id));
                }}
              />

              {/* Emission color */}
              <ColorInput togglable
                label="Emission"
                className="mb-3"
                color={currentEmissionColor}
                enabled={currentEmissionColorEnabled}
                containerRef={outerContainerRef}
                onEnabledChange={(newValue) => {
                  controller.mutator.apply(new SetModelMaterialOverrideEmissionColorEnabledMutation(controller.model.id, selectedMaterialName, newValue));
                }}
                onColorChange={(newValue) => controller.mutator.debounceContinuous(
                  SetModelMaterialOverrideEmissionColorMutation,
                  controller.model,
                  () => new SetModelMaterialOverrideEmissionColorMutation(controller.model.id, selectedMaterialName),
                  () => ({ emissionColor: newValue }),
                )}
              />

              {/* Reflection (nested config) */}
              <ReflectionInput
                controller={controller}
                overrideData={overrideData}
              />

            </div>
          </>
        )}
      </div>
    </>
  );
});

export interface ReflectionInputProps {
  overrideData: MeshAssetMaterialOverrideData | undefined;
  controller: ModelMaterialEditorController;
}
export const ReflectionInput: FunctionComponent<ReflectionInputProps> = observer(({ overrideData, controller }) => {
  // Refs
  const typeSelectElementRef = useRef<HTMLSelectElement>(null);

  // Computed state
  const selectedMaterialName = controller.selectedMaterialName!;
  const currentReflectionEnabled = overrideData?.reflectionEnabled || false;
  const currentReflection = overrideData?.reflection;

  // Functions
  const onSelectReflectionType = (type: MeshAssetMaterialOverrideReflectionType | ""): void => {
    let reflectionType: MeshAssetMaterialOverrideReflectionType | undefined;
    if (type === "") {
      reflectionType = undefined;
    } else {
      reflectionType = type as MeshAssetMaterialOverrideReflectionType;
    }
    controller.mutator.apply(new SetModelMaterialOverrideReflectionTypeMutation(controller.model.id, selectedMaterialName, reflectionType));
  };

  const ReflectionStrength = observer(() => {
    const currentReflectionStrength = currentReflection?.strength ?? RetroMaterial.Defaults.reflectionStrength;

    return (
      <div className="mb-3">
        <label className="font-bold flex flex-row items-center">
          Strength
        </label>

        <div className="flex flex-row">
          <NumberInput
            className="shrink-0 w-[80px] mr-2"
            value={currentReflectionStrength}
            displayLabelAsSubProperty={true}
            incrementInterval={0.1}
            minValue={0}
            maxValue={1}
            onChange={(newValue) => {
              controller.mutator.debounceContinuous(
                SetModelMaterialOverrideReflectionStrengthMutation,
                controller.model,
                () => new SetModelMaterialOverrideReflectionStrengthMutation(controller.model.id, selectedMaterialName),
                () => ({ reflectionStrength: newValue }),
              );
            }}
          />

          <input
            type="range"
            className="grow"
            min={0}
            max={1}
            step={0.01}
            value={currentReflectionStrength}
            disabled={!currentReflectionEnabled}
            onChange={(e) => {
              const newValue = Number(e.target.value);
              controller.mutator.debounceContinuous(
                SetModelMaterialOverrideReflectionStrengthMutation,
                controller.model,
                () => new SetModelMaterialOverrideReflectionStrengthMutation(controller.model.id, selectedMaterialName),
                () => ({ reflectionStrength: newValue }),
              );
            }}
          />
        </div>
      </div>
    );
  });

  return (
    <div className="mb-3">
      <div>
        <label className="font-bold flex flex-row items-center">
          <input
            type="checkbox"
            className="mr-2 w-4 h-4"
            checked={currentReflectionEnabled}
            onChange={(e) => {
              const newValue = e.target.checked;
              controller.mutator.apply(new SetModelMaterialOverrideReflectionEnabledMutation(controller.model.id, selectedMaterialName, newValue));
            }}
          />
          Reflection
        </label>
      </div>
      <div>
        <select
          ref={typeSelectElementRef}
          name="add-new-component"
          className="w-full p-3 mb-2 disabled:opacity-30"
          onChange={(e) => onSelectReflectionType(e.target.value as (MeshAssetMaterialOverrideReflectionType | ""))}
          value={currentReflection?.type ?? ""}
          disabled={!currentReflectionEnabled}
        >
          {currentReflection?.type === undefined && (
            <option value="">-- Select type --</option>
          )}
          <option value={'box-net' satisfies MeshAssetMaterialOverrideReflectionType}>Box-Net</option>
          <option value={'3x2' satisfies MeshAssetMaterialOverrideReflectionType}>3x2</option>
          <option value={'6x1' satisfies MeshAssetMaterialOverrideReflectionType}>6x1</option>
          <option value={'separate' satisfies MeshAssetMaterialOverrideReflectionType}>Separate</option>
        </select>

        <div className="pl-3">
          {currentReflection?.type === 'box-net' ? (
            <>
              {/* Box-net reflection texture */}
              <TextureAssetReference
                label="Texture"
                className="mb-2"
                enabled={currentReflectionEnabled}
                asset={currentReflection.texture as TextureAssetData}
                assetType={AssetType.Texture}
                onAssetChange={(newValue) => {
                  controller.mutator.apply(new SetModelMaterialOverrideReflectionBoxNetTextureMutation(controller.model.id, selectedMaterialName, newValue?.id));
                }}
              />
              {/* Reflection strength */}
              <ReflectionStrength />
            </>
          ) : currentReflection?.type === '6x1' ? (
            <>
              {/* 6x1 reflection texture */}
              <TextureAssetReference
                label="Texture"
                className="mb-2"
                enabled={currentReflectionEnabled}
                asset={currentReflection.texture as TextureAssetData}
                assetType={AssetType.Texture}
                onAssetChange={(newValue) => {
                  controller.mutator.apply(new SetModelMaterialOverrideReflection6x1TextureMutation(controller.model.id, selectedMaterialName, newValue?.id));
                }}
              />
              {/* Reflection strength */}
              <ReflectionStrength />
            </>
          ) : currentReflection?.type === '3x2' ? (
            <>
              {/* 3x2 reflection texture */}
              <TextureAssetReference
                label="Texture"
                className="mb-2"
                enabled={currentReflectionEnabled}
                asset={currentReflection.texture as TextureAssetData}
                assetType={AssetType.Texture}
                onAssetChange={(newValue) => {
                  controller.mutator.apply(new SetModelMaterialOverrideReflection3x2TextureMutation(controller.model.id, selectedMaterialName, newValue?.id));
                }}
              />
              {/* Reflection strength */}
              <ReflectionStrength />
            </>
          ) : currentReflection?.type === 'separate' ? (
            <>
              {/* Positive X reflection texture */}
              <TextureAssetReference
                label="Texture (+x)"
                enabled={currentReflectionEnabled}
                asset={currentReflection.pxTexture as TextureAssetData}
                assetType={AssetType.Texture}
                onAssetChange={(newValue) => {
                  controller.mutator.apply(new SetModelMaterialOverrideReflectionSeparateTextureMutation(controller.model.id, selectedMaterialName, newValue?.id, ReflectionSeparateTexture.positiveX));
                }}
              />
              {/* Negative X reflection texture */}
              <TextureAssetReference
                label="Texture (-x)"
                enabled={currentReflectionEnabled}
                asset={currentReflection.nxTexture as TextureAssetData}
                assetType={AssetType.Texture}
                onAssetChange={(newValue) => {
                  controller.mutator.apply(new SetModelMaterialOverrideReflectionSeparateTextureMutation(controller.model.id, selectedMaterialName, newValue?.id, ReflectionSeparateTexture.negativeX));
                }}
              />
              {/* Positive Y reflection texture */}
              <TextureAssetReference
                label="Texture (+y)"
                enabled={currentReflectionEnabled}
                asset={currentReflection.pyTexture as TextureAssetData}
                assetType={AssetType.Texture}
                onAssetChange={(newValue) => {
                  controller.mutator.apply(new SetModelMaterialOverrideReflectionSeparateTextureMutation(controller.model.id, selectedMaterialName, newValue?.id, ReflectionSeparateTexture.positiveY));
                }}
              />
              {/* Negative Y reflection texture */}
              <TextureAssetReference
                label="Texture (-y)"
                enabled={currentReflectionEnabled}
                asset={currentReflection.nyTexture as TextureAssetData}
                assetType={AssetType.Texture}
                onAssetChange={(newValue) => {
                  controller.mutator.apply(new SetModelMaterialOverrideReflectionSeparateTextureMutation(controller.model.id, selectedMaterialName, newValue?.id, ReflectionSeparateTexture.negativeY));
                }}
              />
              {/* Positive Z reflection texture */}
              <TextureAssetReference
                label="Texture (+z)"
                enabled={currentReflectionEnabled}
                asset={currentReflection.pzTexture as TextureAssetData}
                assetType={AssetType.Texture}
                onAssetChange={(newValue) => {
                  controller.mutator.apply(new SetModelMaterialOverrideReflectionSeparateTextureMutation(controller.model.id, selectedMaterialName, newValue?.id, ReflectionSeparateTexture.positiveZ));
                }}
              />
              {/* Negative Z reflection texture */}
              <TextureAssetReference
                label="Texture (-z)"
                className="mb-2"
                enabled={currentReflectionEnabled}
                asset={currentReflection.nzTexture as TextureAssetData}
                assetType={AssetType.Texture}
                onAssetChange={(newValue) => {
                  controller.mutator.apply(new SetModelMaterialOverrideReflectionSeparateTextureMutation(controller.model.id, selectedMaterialName, newValue?.id, ReflectionSeparateTexture.negativeZ));
                }}
              />
              {/* Reflection strength */}
              <ReflectionStrength />
            </>
          ) : currentReflection === undefined ? (
            <>{/* Empty */}</>
          ) : (
            <div>Unknown reflection override type: &apos;{(currentReflection as { type: any })?.type}&apos;</div>
          )}
        </div>
      </div>
    </div >
  );
});
