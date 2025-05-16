import { AssetType } from "@polyzone/runtime/src/cartridge";
import { IModelEditorViewMutation } from "../IModelEditorViewMutation";
import { ModelEditorViewMutationArguments } from "../ModelEditorViewMutationArguments";
import { reconcileMaterialOverrideData } from "./util/reconcile-overrides";

export class SetModelMaterialOverrideDiffuseTextureMutation implements IModelEditorViewMutation {
  // Mutation parameters
  private readonly modelAssetId: string;
  private readonly materialName: string;
  private readonly diffuseTextureAssetId: string | undefined;

  // Undo state
  private oldDiffuseTextureAssetId: string | undefined;

  public constructor(modelAssetId: string, materialName: string, diffuseTextureAssetId: string | undefined) {
    this.modelAssetId = modelAssetId;
    this.materialName = materialName;
    this.diffuseTextureAssetId = diffuseTextureAssetId;
  }

  public apply({ ProjectController, ModelEditorViewController }: ModelEditorViewMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const diffuseTextureAssetData = this.diffuseTextureAssetId ? ProjectController.project.assets.getById(this.diffuseTextureAssetId, AssetType.Texture) : undefined;
    let materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);
    const material = ModelEditorViewController.getMaterialByName(this.materialName);

    // 0. Store undo data
    this.oldDiffuseTextureAssetId = materialOverridesData?.diffuseTexture?.id;

    // 1. Update data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      overrides.diffuseTexture = diffuseTextureAssetData;
    });

    // 2. Update Babylon state
    materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName)!;
    if (materialOverridesData.diffuseTexture !== undefined) {
      ProjectController.assetCache.loadAsset(materialOverridesData.diffuseTexture, ModelEditorViewController.scene)
        .then((textureAsset) => {
          material.overridesFromAsset.diffuseTexture = textureAsset.texture;
        });
    } else {
      material.overridesFromAsset.diffuseTexture = undefined;
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
    return `Set material diffuse texture override`;
  }
}
