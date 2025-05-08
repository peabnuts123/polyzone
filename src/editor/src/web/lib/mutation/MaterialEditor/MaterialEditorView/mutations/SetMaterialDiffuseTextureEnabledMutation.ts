
import { MaterialDefinition } from "@polyzone/runtime/src/world";
import { resolvePath } from "@lib/util/JsoncContainer";
import { IMaterialEditorViewMutation } from "../IMaterialEditorViewMutation";
import { MaterialEditorViewMutationArguments } from "../MaterialEditorViewMutationArguments";

export class SetMaterialDiffuseTextureEnabledMutation implements IMaterialEditorViewMutation {
  // Mutation parameters
  private readonly diffuseTextureEnabled: boolean;

  // Undo state
  private oldDiffuseTextureEnabled: boolean | undefined;

  public constructor(diffuseTextureEnabled: boolean) {
    this.diffuseTextureEnabled = diffuseTextureEnabled;
  }

  public apply({ ProjectController, MaterialEditorViewController }: MaterialEditorViewMutationArguments): void {
    const { materialData, materialInstance } = MaterialEditorViewController;

    // 0. Store undo data
    this.oldDiffuseTextureEnabled = materialData.diffuseTextureEnabled;

    // 1. Update data
    materialData.diffuseTextureEnabled = this.diffuseTextureEnabled;

    // 2. Update Babylon state
    if (materialData.diffuseTexture !== undefined) {
      // Enabling override
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
      // Disabling override
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
    return `${this.diffuseTextureEnabled ? "Enable" : "Disable"} material diffuse texture`;
  }
}
