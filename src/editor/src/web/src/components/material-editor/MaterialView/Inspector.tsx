import { useRef, type FunctionComponent } from "react";
import { observer } from "mobx-react-lite";

import { RetroMaterial } from "@polyzone/runtime/src/materials/RetroMaterial";
import { toColor3Core } from "@polyzone/runtime/src/util";
import { AssetType, MeshAssetMaterialOverrideReflectionType } from "@polyzone/runtime/src/cartridge/archive";

import { TextureAssetData } from "@lib/project/data";
import { ReflectionSeparateTexture } from "@lib/mutation/MaterialEditor/ModelEditorView/mutations";
import {
  SetMaterialDiffuseColorEnabledMutation,
  SetMaterialDiffuseColorMutation,
  SetMaterialDiffuseTextureEnabledMutation,
  SetMaterialDiffuseTextureMutation,
  SetMaterialEmissionColorEnabledMutation,
  SetMaterialEmissionColorMutation,
  SetMaterialReflection3x2TextureMutation,
  SetMaterialReflection6x1TextureMutation,
  SetMaterialReflectionBoxNetTextureMutation,
  SetMaterialReflectionEnabledMutation,
  SetMaterialReflectionSeparateTextureMutation,
  SetMaterialReflectionStrengthMutation,
  SetMaterialReflectionTypeMutation,
} from "@lib/mutation/MaterialEditor/MaterialEditorView/mutations";
import { MaterialEditorViewController } from "@lib/material-editor/material/MaterialEditorViewController";
import { ColorInput, createAssetReferenceComponentOfType, NumberInput } from "@app/components/common/inputs";
import Spinner from "@app/components/spinner";

const TextureAssetReference = createAssetReferenceComponentOfType<AssetType.Texture>();

interface Props {
  materialEditorViewController: MaterialEditorViewController;
}
export const Inspector: FunctionComponent<Props> = observer(({ materialEditorViewController: controller }) => {
  // Refs
  const outerContainerRef = useRef<HTMLDivElement>(null);

  if (!controller.hasLoadedMaterial) {
    return (
      <>
        <Spinner />
      </>
    );
  }

  // Computed state
  const currentDiffuseColorEnabled = controller.materialData.diffuseColorEnabled || false;
  const currentDiffuseColor = toColor3Core(controller.materialData.diffuseColorRawValue || RetroMaterial.Defaults.diffuseColor);
  const currentDiffuseTextureEnabled = controller.materialData.diffuseTextureEnabled || false;
  const currentDiffuseTexture = controller.materialData.diffuseTextureRawValue as TextureAssetData | undefined;
  const currentEmissionColorEnabled = controller.materialData.emissionColorEnabled || false;
  const currentEmissionColor = toColor3Core(controller.materialData.emissionColorRawValue || RetroMaterial.Defaults.emissiveColor);

  return (
    <>
      <div className="p-2 bg-gradient-to-b from-[blue] to-pink-500 text-white text-retro-shadow shrink-0">
        <h2 className="text-lg">Inspector</h2>
      </div>
      <div className="bg-slate-300 h-full overflow-y-scroll grow" ref={outerContainerRef}>
        <div className="p-2">

          {/* Diffuse color */}
          <ColorInput togglable
            label="Color"
            className="mb-3"
            color={currentDiffuseColor}
            enabled={currentDiffuseColorEnabled}
            containerRef={outerContainerRef}
            onEnabledChange={(newValue) => {
              controller.mutator.apply(new SetMaterialDiffuseColorEnabledMutation(newValue));
            }}
            onColorChange={(newValue) => controller.mutator.debounceContinuous(
              SetMaterialDiffuseColorMutation,
              controller.materialData,
              () => new SetMaterialDiffuseColorMutation(),
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
              controller.mutator.apply(new SetMaterialDiffuseTextureEnabledMutation(newValue));
            }}
            onAssetChange={(newValue) => {
              controller.mutator.apply(new SetMaterialDiffuseTextureMutation(newValue?.id));
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
              controller.mutator.apply(new SetMaterialEmissionColorEnabledMutation(newValue));
            }}
            onColorChange={(newValue) => controller.mutator.debounceContinuous(
              SetMaterialEmissionColorMutation,
              controller.materialData,
              () => new SetMaterialEmissionColorMutation(),
              () => ({ emissionColor: newValue }),
            )}
          />

          {/* Reflection (nested config) */}
          <ReflectionInput
            controller={controller}
          />

        </div>
      </div>
    </>
  );
});

export interface ReflectionInputProps {
  controller: MaterialEditorViewController;
}
/* @NOTE Very similar to ModelView Inspector - just different mutations */
export const ReflectionInput: FunctionComponent<ReflectionInputProps> = observer(({ controller }) => {
  // Refs
  const typeSelectElementRef = useRef<HTMLSelectElement>(null);

  // Computed state
  const currentReflectionEnabled = controller.materialData.reflectionEnabled || false;
  const currentReflection = controller.materialData.reflectionRawValue;

  // Functions
  const onSelectReflectionType = (type: MeshAssetMaterialOverrideReflectionType | ""): void => {
    let reflectionType: MeshAssetMaterialOverrideReflectionType | undefined;
    if (type === "") {
      reflectionType = undefined;
    } else {
      reflectionType = type as MeshAssetMaterialOverrideReflectionType;
    }
    controller.mutator.apply(new SetMaterialReflectionTypeMutation(reflectionType));
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
                SetMaterialReflectionStrengthMutation,
                controller.materialData,
                () => new SetMaterialReflectionStrengthMutation(),
                () => ({ reflectionStrength: newValue }),
              );
            }}
          />

          <input
            type="range"
            className="w-full"
            min={0}
            max={1}
            step={0.01}
            value={currentReflectionStrength}
            disabled={!currentReflectionEnabled}
            onChange={(e) => {
              const newValue = Number(e.target.value);
              controller.mutator.debounceContinuous(
                SetMaterialReflectionStrengthMutation,
                controller.materialData,
                () => new SetMaterialReflectionStrengthMutation(),
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
              controller.mutator.apply(new SetMaterialReflectionEnabledMutation(newValue));
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
                  controller.mutator.apply(new SetMaterialReflectionBoxNetTextureMutation(newValue?.id));
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
                  controller.mutator.apply(new SetMaterialReflection6x1TextureMutation(newValue?.id));
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
                  controller.mutator.apply(new SetMaterialReflection3x2TextureMutation(newValue?.id));
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
                  controller.mutator.apply(new SetMaterialReflectionSeparateTextureMutation(newValue?.id, ReflectionSeparateTexture.positiveX));
                }}
              />
              {/* Negative X reflection texture */}
              <TextureAssetReference
                label="Texture (-x)"
                enabled={currentReflectionEnabled}
                asset={currentReflection.nxTexture as TextureAssetData}
                assetType={AssetType.Texture}
                onAssetChange={(newValue) => {
                  controller.mutator.apply(new SetMaterialReflectionSeparateTextureMutation(newValue?.id, ReflectionSeparateTexture.negativeX));
                }}
              />
              {/* Positive Y reflection texture */}
              <TextureAssetReference
                label="Texture (+y)"
                enabled={currentReflectionEnabled}
                asset={currentReflection.pyTexture as TextureAssetData}
                assetType={AssetType.Texture}
                onAssetChange={(newValue) => {
                  controller.mutator.apply(new SetMaterialReflectionSeparateTextureMutation(newValue?.id, ReflectionSeparateTexture.positiveY));
                }}
              />
              {/* Negative Y reflection texture */}
              <TextureAssetReference
                label="Texture (-y)"
                enabled={currentReflectionEnabled}
                asset={currentReflection.nyTexture as TextureAssetData}
                assetType={AssetType.Texture}
                onAssetChange={(newValue) => {
                  controller.mutator.apply(new SetMaterialReflectionSeparateTextureMutation(newValue?.id, ReflectionSeparateTexture.negativeY));
                }}
              />
              {/* Positive Z reflection texture */}
              <TextureAssetReference
                label="Texture (+z)"
                enabled={currentReflectionEnabled}
                asset={currentReflection.pzTexture as TextureAssetData}
                assetType={AssetType.Texture}
                onAssetChange={(newValue) => {
                  controller.mutator.apply(new SetMaterialReflectionSeparateTextureMutation(newValue?.id, ReflectionSeparateTexture.positiveZ));
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
                  controller.mutator.apply(new SetMaterialReflectionSeparateTextureMutation(newValue?.id, ReflectionSeparateTexture.negativeZ));
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
