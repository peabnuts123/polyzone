
import { AssetType } from "@polyzone/runtime/src/cartridge";
import { IModelMaterialMutation } from "../IModelMaterialMutation";
import { ModelMaterialMutationArguments } from "../ModelMaterialMutationArguments";
import { reconcileMaterialOverrideData } from "./util/reconcile-overrides";

export class SetModelMaterialOverrideDiffuseTextureMutation implements IModelMaterialMutation {
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

  public apply({ ProjectController, ModelMaterialEditorController }: ModelMaterialMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const diffuseTextureAssetData = this.diffuseTextureAssetId ? ProjectController.project.assets.getById(this.diffuseTextureAssetId, AssetType.Texture) : undefined;
    let materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);
    const material = ModelMaterialEditorController.getMaterialByName(this.materialName);

    // 0. Store undo data
    this.oldDiffuseTextureAssetId = materialOverridesData?.diffuseTexture?.id;

    // 1. Update data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      overrides.diffuseTexture = diffuseTextureAssetData;
    });

    // 2. Update Babylon state
    materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName)!;
    if (diffuseTextureAssetData) {
      if (materialOverridesData.diffuseTexture !== undefined) {
        ModelMaterialEditorController.assetCache.loadAsset(
          materialOverridesData.diffuseTexture,
          {
            scene: ModelMaterialEditorController.scene,
            assetDb: ProjectController.project.assets,
          },
        ).then((textureAsset) => {
          material.overridesFromAsset.diffuseTexture = textureAsset.texture;
        });
      }
    } else {
      material.overridesFromAsset.diffuseTexture = undefined;
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
    return `Set material diffuse texture override`;
  }
}
