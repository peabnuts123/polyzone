
import { IModelEditorViewMutation } from "../IModelEditorViewMutation";
import { ModelEditorViewMutationArguments } from "../ModelEditorViewMutationArguments";
import { AssetType } from "@polyzone/runtime/src/cartridge";
import { reconcileMaterialOverrideData } from "./util/reconcile-overrides";

export class SetModelMaterialOverrideDiffuseTextureEnabledMutation implements IModelEditorViewMutation {
  // Mutation parameters
  private readonly modelAssetId: string;
  private readonly materialName: string;
  private readonly diffuseTextureEnabled: boolean;

  // Undo state
  private oldDiffuseTextureEnabled: boolean | undefined;

  public constructor(modelAssetId: string, materialName: string, diffuseTextureEnabled: boolean) {
    this.modelAssetId = modelAssetId;
    this.materialName = materialName;
    this.diffuseTextureEnabled = diffuseTextureEnabled;
  }

  public apply({ ProjectController, ModelEditorViewController }: ModelEditorViewMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    let materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);
    const material = ModelEditorViewController.getMaterialByName(this.materialName);

    // 0. Store undo data
    this.oldDiffuseTextureEnabled = materialOverridesData?.diffuseTextureEnabled;

    // 1. Update data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      overrides.diffuseTextureEnabled = this.diffuseTextureEnabled;
    });

    // 2. Update Babylon state
    materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName)!;
    if (materialOverridesData.diffuseTexture !== undefined) {
      // Enabling override
      ModelEditorViewController.assetCache.loadAsset(
        materialOverridesData.diffuseTexture,
        {
          scene: ModelEditorViewController.scene,
          assetDb: ProjectController.project.assets,
        },
      ).then((textureAsset) => {
        material.overridesFromAsset.diffuseTexture = textureAsset.texture;
      });
    } else {
      // Disabling override
      material.overridesFromAsset.diffuseTexture = undefined;
    }

    // 3. Update JSONC
    reconcileMaterialOverrideData(meshAssetData, ProjectController);
  }

  public undo(_args: ModelEditorViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `${this.diffuseTextureEnabled ? "Enable" : "Disable"} material diffuse texture override`;
  }
}
