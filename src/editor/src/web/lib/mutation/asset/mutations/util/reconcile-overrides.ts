import { resolvePathForAssetMutation } from "@lib/mutation/util";
import { MeshAssetData, MeshAssetMaterialOverrideData } from "@lib/project/data";
import { MeshAssetDefinition } from "@lib/project/definition";
import { ProjectController } from "@lib/project/ProjectController";
import { MeshAssetMaterialOverrideDefinition, MeshAssetMaterialOverrideReflection3x2Data, MeshAssetMaterialOverrideReflection6x1Data, MeshAssetMaterialOverrideReflectionBoxNetData, MeshAssetMaterialOverrideReflectionBoxNetDefinition, MeshAssetMaterialOverrideReflectionData, MeshAssetMaterialOverrideReflectionDataOfType, MeshAssetMaterialOverrideReflectionDefinitionOfType, MeshAssetMaterialOverrideReflectionSeparateData, MeshAssetMaterialOverrideReflectionType } from "@polyzone/runtime/src/cartridge";
import { toColor3Definition } from "@polyzone/runtime/src/util/color";


/**
 * Reconcile material overrides for in-memory mesh asset with its definition on-disk.
 * i.e. Add/Update/Remove properties and blocks based on whether they are enabled.
 */
export function reconcileMaterialOverrideData(meshAssetData: MeshAssetData, ProjectController: ProjectController): void {
  if (meshAssetData.areAllOverridesEmpty()) {
    // No meaningful overrides left
    // Remove overrides block from asset definition entirely
    const mutationPath = resolvePathForAssetMutation(
      meshAssetData.id,
      ProjectController.projectDefinition,
      (meshAsset) => (meshAsset as MeshAssetDefinition).materialOverrides,
    );
    ProjectController.projectJson.delete(mutationPath);
  } else {
    // Asset has SOME non-empty material overrides
    // Reconcile each property for all material overrides

    /* Diffuse color */
    reconcileMaterialOverridesForProperty(
      meshAssetData,
      ProjectController,
      /* Is enabled */(materialOverrideData) => materialOverrideData.diffuseColorEnabled,
      /* Asset definition path */(materialOverrideDefinition) => materialOverrideDefinition.diffuseColor!,
      /* Updated value */(materialOverrideData) => toColor3Definition(materialOverrideData.diffuseColor!),
    );

    /* Diffuse texture */
    reconcileMaterialOverridesForProperty(
      meshAssetData,
      ProjectController,
      /* Is enabled */(materialOverrideData) => materialOverrideData.diffuseTextureEnabled,
      /* Asset definition path */(materialOverrideDefinition) => materialOverrideDefinition.diffuseTextureAssetId!,
      /* Updated value */(materialOverrideData) => materialOverrideData.diffuseTexture!.id,
    );

    /* Reflection */
    reconcileMaterialOverridesForProperty(
      meshAssetData,
      ProjectController,
      /* Is enabled */(materialOverrideData) => materialOverrideData.reflectionEnabled,
      /* Asset definition path */(materialOverrideDefinition) => materialOverrideDefinition.reflection!,
      /* Updated value */(materialOverrideData) => reflectionDataToDefinition(materialOverrideData.reflection!),
    );

    /* Emission color */
    reconcileMaterialOverridesForProperty(
      meshAssetData,
      ProjectController,
      /* Is enabled */(materialOverrideData) => materialOverrideData.emissionColorEnabled,
      /* Asset definition path */(materialOverrideDefinition) => materialOverrideDefinition.emissionColor!,
      /* Updated value */(materialOverrideData) => toColor3Definition(materialOverrideData.emissionColor!),
    );

    // Reconcile definition vs. data (i.e. sanity check from the opposite direction)
    const meshAssetDefinition = ProjectController.projectDefinition.assets.find((assetDefinition) => assetDefinition.id === meshAssetData.id) as MeshAssetDefinition | undefined;
    if (meshAssetDefinition === undefined) throw new Error(`Could not find matching asset definition in project for id '${meshAssetData.id}'`);

    for (const materialName in meshAssetDefinition.materialOverrides) {
      if (meshAssetData.getOverridesForMaterial(materialName) === undefined) {
        // Override present in asset definition but NOT in asset data - this override has been removed
        // Remove override block from asset definition
        const mutationPath = resolvePathForAssetMutation(
          meshAssetData.id,
          ProjectController.projectDefinition,
          (meshAsset) => (meshAsset as MeshAssetDefinition).materialOverrides![materialName],
        );
        ProjectController.projectJson.delete(mutationPath);
      }
    }
  }
}

/**
 * Perform reconciliation of material overrides for a specific property (e.g. diffuseColor)
 * @param meshAssetData
 * @param ProjectController
 * @param isOverrideEnabled Selector for `____Enabled` property (e.g. `diffuseColorEnabled`)
 * @param selectDefinitionPath Selector for property path within asset definition
 * @param getUpdatedValue Selector for updated property value (if applicable) for writing into the asset definition
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
function reconcileMaterialOverridesForProperty<TValueDefinition extends {}>(
  meshAssetData: MeshAssetData,
  ProjectController: ProjectController,
  isOverrideEnabled: (materialOverrideData: MeshAssetMaterialOverrideData) => boolean,
  selectDefinitionPath: (materialOverrideDefinition: MeshAssetMaterialOverrideDefinition) => TValueDefinition,
  getUpdatedValue: (materialOverrideData: MeshAssetMaterialOverrideData) => TValueDefinition,
): void {
  // Reconcile each material override
  // 1. If material has no enabled overrides left, remove the material from the overrides block
  // 2. If the material has this override, set its value
  // 3. If the material has some overrides but not this one, remove it
  for (const materialName in meshAssetData.materialOverrides) {
    if (meshAssetData.isMaterialOverrideEmpty(materialName)) {
      // This override is empty, but others are not
      // Remove this material override block
      const mutationPath = resolvePathForAssetMutation(
        meshAssetData.id,
        ProjectController.projectDefinition,
        (meshAsset) => (meshAsset as MeshAssetDefinition).materialOverrides![materialName],
      );
      ProjectController.projectJson.delete(mutationPath);
    } else {
      // This override is not empty i.e. this material has some enabled / defined overrides

      const materialOverridesData = meshAssetData.materialOverrides[materialName];
      if (isOverrideEnabled(materialOverridesData)) {
        // Override is enabled and defined
        // Write the override into project json
        const mutationPath = resolvePathForAssetMutation(
          meshAssetData.id,
          ProjectController.projectDefinition,
          (meshAsset) => selectDefinitionPath((meshAsset as MeshAssetDefinition).materialOverrides![materialName]),
        );
        ProjectController.projectJson.mutate(mutationPath, getUpdatedValue(materialOverridesData));
      } else {
        // Override is not enabled
        // Remove the override from project json
        const mutationPath = resolvePathForAssetMutation(
          meshAssetData.id,
          ProjectController.projectDefinition,
          (meshAsset) => selectDefinitionPath((meshAsset as MeshAssetDefinition).materialOverrides![materialName]),
        );
        ProjectController.projectJson.delete(mutationPath);
      }
    }
  }
}

// @TODO Should this live somewhere else?
function reflectionDataToDefinition<TReflectionType extends MeshAssetMaterialOverrideReflectionType>(reflection: MeshAssetMaterialOverrideReflectionDataOfType<TReflectionType>): MeshAssetMaterialOverrideReflectionDefinitionOfType<TReflectionType> {
  switch (reflection.type) {
    case "box-net":
      const reflectionBoxNet = reflection as MeshAssetMaterialOverrideReflectionBoxNetData;
      return {
        type: reflectionBoxNet.type,
        textureAssetId: reflectionBoxNet.texture.id,
      } as MeshAssetMaterialOverrideReflectionDefinitionOfType<TReflectionType>;
    case "3x2":
      const reflection3x2 = reflection as MeshAssetMaterialOverrideReflection3x2Data;
      return {
        type: reflection3x2.type,
        textureAssetId: reflection3x2.texture.id,
      } as MeshAssetMaterialOverrideReflectionDefinitionOfType<TReflectionType>;
    case "6x1":
      const reflection6x1 = reflection as MeshAssetMaterialOverrideReflection6x1Data;
      return {
        type: reflection6x1.type,
        textureAssetId: reflection6x1.texture.id,
      } as MeshAssetMaterialOverrideReflectionDefinitionOfType<TReflectionType>;
    case "separate":
      const reflectionSeparate = reflection as MeshAssetMaterialOverrideReflectionSeparateData;
      return {
        type: reflectionSeparate.type,
        pxTextureAssetId: reflectionSeparate.pxTexture.id,
        nxTextureAssetId: reflectionSeparate.nxTexture.id,
        pyTextureAssetId: reflectionSeparate.pyTexture.id,
        nyTextureAssetId: reflectionSeparate.nyTexture.id,
        pzTextureAssetId: reflectionSeparate.pzTexture.id,
        nzTextureAssetId: reflectionSeparate.nzTexture.id,
      } as MeshAssetMaterialOverrideReflectionDefinitionOfType<TReflectionType>;
    default:
      throw new Error(`Unimplemented reflection data type: '${(reflection as any).type}'`);
  }
}
