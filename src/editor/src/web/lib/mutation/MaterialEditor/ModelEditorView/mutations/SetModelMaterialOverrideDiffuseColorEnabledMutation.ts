
import { IModelEditorViewMutation } from "../IModelEditorViewMutation";
import { ModelEditorViewMutationArguments } from "../ModelEditorViewMutationArguments";
import { AssetType } from "@polyzone/runtime/src/cartridge";
import { toColor3Babylon, toColor3Core } from "@polyzone/runtime/src/util";
import { RetroMaterial } from "@polyzone/runtime/src/materials/RetroMaterial";
import { reconcileMaterialOverrideData } from "./util/reconcile-overrides";

export class SetModelMaterialOverrideDiffuseColorEnabledMutation implements IModelEditorViewMutation {
  // Mutation parameters
  private readonly modelAssetId: string;
  private readonly materialName: string;
  private readonly diffuseColorEnabled: boolean;

  // Undo state
  private oldDiffuseColorEnabled: boolean | undefined;

  public constructor(modelAssetId: string, materialName: string, diffuseColorEnabled: boolean) {
    this.modelAssetId = modelAssetId;
    this.materialName = materialName;
    this.diffuseColorEnabled = diffuseColorEnabled;
  }

  public apply({ ProjectController, ModelEditorViewController }: ModelEditorViewMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    let materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);
    const material = ModelEditorViewController.getMaterialByName(this.materialName);

    // 0. Store undo data
    this.oldDiffuseColorEnabled = materialOverridesData?.diffuseColorEnabled;

    // 1. Update data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      overrides.diffuseColorEnabled = this.diffuseColorEnabled;
      if (this.diffuseColorEnabled) {
        // Also ensure color override is set if we're enabling it
        overrides.diffuseColor ??= toColor3Core(RetroMaterial.Defaults.diffuseColor);
      }
    });

    // 2. Update Babylon state
    materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName)!;
    if (this.diffuseColorEnabled) {
      // Enabling override
      // Since we made sure the override had a color if it was enabled,
      // we know that there MUST be a value in the overrides data at this point
      material.overridesFromAsset.diffuseColor = toColor3Babylon(materialOverridesData.diffuseColor!);
    } else {
      // Disabling override - remove color from material
      material.overridesFromAsset.diffuseColor = undefined;
    }

    // 3. Update JSONC
    reconcileMaterialOverrideData(meshAssetData, ProjectController);
  }

  public async afterPersistChanges({ ProjectController, ModelEditorViewController }: ModelEditorViewMutationArguments): Promise<void> {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);

    // - Refresh asset cache (e.g. asset dependencies, etc)
    ProjectController.assetCache.delete(meshAssetData.id);
    await ProjectController.assetCache.loadAsset(meshAssetData, ModelEditorViewController.scene);
  }

  public undo(_args: ModelEditorViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `${this.diffuseColorEnabled ? "Enable" : "Disable"} material diffuse color override`;
  }
}
