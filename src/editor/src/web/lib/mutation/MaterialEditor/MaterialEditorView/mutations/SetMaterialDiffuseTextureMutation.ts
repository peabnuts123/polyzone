
import { AssetType } from "@polyzone/runtime/src/cartridge";
import { MaterialDefinition } from "@polyzone/runtime/src/world";
import { resolvePath } from "@lib/util/JsoncContainer";
import { IMaterialEditorViewMutation } from "../IMaterialEditorViewMutation";
import { MaterialEditorViewMutationArguments } from "../MaterialEditorViewMutationArguments";

export class SetMaterialDiffuseTextureMutation implements IMaterialEditorViewMutation {
  // Mutation parameters
  private readonly diffuseTextureAssetId: string | undefined;

  // Undo state
  private oldDiffuseTextureAssetId: string | undefined;

  public constructor(diffuseTextureAssetId: string | undefined) {
    this.diffuseTextureAssetId = diffuseTextureAssetId;
  }

  public apply({ ProjectController, MaterialEditorViewController }: MaterialEditorViewMutationArguments): void {
    const diffuseTextureAssetData = this.diffuseTextureAssetId ? ProjectController.project.assets.getById(this.diffuseTextureAssetId, AssetType.Texture) : undefined;
    const { materialData, materialInstance } = MaterialEditorViewController;

    // 0. Store undo data
    this.oldDiffuseTextureAssetId = materialData.diffuseTexture?.id;

    // 1. Update data
    materialData.diffuseTexture = diffuseTextureAssetData;

    // 2. Update Babylon state
    if (materialData.diffuseTexture !== undefined) {
      MaterialEditorViewController.assetCache.loadAsset(
        materialData.diffuseTexture,
        {
          scene: MaterialEditorViewController.scene,
          assetDb: ProjectController.project.assets,
        },
      ).then((textureAsset) => {
        materialInstance.overridesFromMaterial.diffuseTexture = textureAsset.texture;
      });
    } else {
      materialInstance.overridesFromMaterial.diffuseTexture = undefined;
    }

    // 3. Update JSONC
    const jsonPath = resolvePath((materialDefinition: MaterialDefinition) => materialDefinition.diffuseTextureAssetId);
    if (materialData.diffuseTexture !== undefined) {
      MaterialEditorViewController.materialJson.mutate(jsonPath, materialData.diffuseTexture.id);
    }
    else {
      MaterialEditorViewController.materialJson.delete(jsonPath);
    }
  }

  public undo(_args: MaterialEditorViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `Set material diffuse texture`;
  }
}
