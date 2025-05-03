import { IModelMaterialMutation } from "../IModelMaterialMutation";
import { ModelMaterialMutationArguments } from "../ModelMaterialMutationArguments";
import { AssetType } from "@polyzone/runtime/src/cartridge";
import { reconcileMaterialOverrideData } from "./util/reconcile-overrides";
import { ReflectionLoading } from "@polyzone/runtime/src/world";

export class SetModelMaterialOverrideReflectionEnabledMutation implements IModelMaterialMutation {
  // Mutation parameters
  private readonly modelAssetId: string;
  private readonly materialName: string;
  private readonly reflectionEnabled: boolean;

  // Undo state
  private oldReflectionEnabled: boolean | undefined;

  public constructor(modelAssetId: string, materialName: string, reflectionEnabled: boolean) {
    this.modelAssetId = modelAssetId;
    this.materialName = materialName;
    this.reflectionEnabled = reflectionEnabled;
  }

  public apply({ ProjectController, ModelMaterialEditorController }: ModelMaterialMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    let materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);
    const material = ModelMaterialEditorController.getMaterialByName(this.materialName);

    // 0. Store undo data
    this.oldReflectionEnabled = materialOverridesData?.reflectionEnabled;

    // 1. Update data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      overrides.reflectionEnabled = this.reflectionEnabled;
    });

    // 2. Update Babylon state
    materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName)!;
    if (this.reflectionEnabled) {
      // Enabling override
      // Set the material's reflection texture IF one is fully defined in the override data
      if (materialOverridesData.reflection !== undefined) {
        ReflectionLoading.load(materialOverridesData.reflection, ModelMaterialEditorController.assetCache, ModelMaterialEditorController.scene)
          .then((reflectionTexture) => {
            material.overrides.reflectionTexture = reflectionTexture;
          });
      }
    } else {
      // Disabling override
      material.overrides.reflectionTexture = undefined;
    }

    // 3. Update JSONC
    reconcileMaterialOverrideData(meshAssetData, ProjectController);
  }

  public undo(_args: ModelMaterialMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `${this.reflectionEnabled ? "Enable" : "Disable"} material reflection override`;
  }
}
