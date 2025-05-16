import { ITextureAssetData, MeshAssetMaterialOverrideReflectionType } from "@polyzone/runtime/src/cartridge";
import { resolvePath } from "@lib/util/JsoncContainer";
import { MaterialAsset, MaterialDefinition, ReflectionLoading } from "@polyzone/runtime/src/world";
import { reflectionDataToDefinition } from "@lib/project/data";
import { IMaterialEditorViewMutation } from "../IMaterialEditorViewMutation";
import { MaterialEditorViewMutationArguments } from "../MaterialEditorViewMutationArguments";

export class SetMaterialReflectionTypeMutation implements IMaterialEditorViewMutation {
  // Mutation parameters
  private readonly reflectionType: MeshAssetMaterialOverrideReflectionType | undefined;

  // Undo state
  private oldReflectionType: MeshAssetMaterialOverrideReflectionType | undefined;

  public constructor(reflectionType: MeshAssetMaterialOverrideReflectionType | undefined) {
    this.reflectionType = reflectionType;
  }

  public apply({ ProjectController, MaterialEditorViewController }: MaterialEditorViewMutationArguments): void {
    const { materialData, materialInstance } = MaterialEditorViewController;

    // 0. Store undo data
    this.oldReflectionType = materialData.reflection?.type;

    // 1. Update data
    if (materialData.reflection?.type !== this.reflectionType) {
      // @NOTE Clear any other data (even though some of it COULD possibly copy across e.g. texture)
      if (this.reflectionType === undefined) {
        materialData.reflection = undefined;
      } else {
        // Create a new reflection data object
        // No previous data - create new blank
        if (materialData.reflection?.type === undefined) {
          materialData.reflection = {
            type: this.reflectionType,
          };
        } else {
          // Copy any existing data from previous config
          let firstTexture: ITextureAssetData | undefined;
          const strength = materialData.reflection.strength;
          switch (materialData.reflection.type) {
            case "box-net":
              firstTexture = materialData.reflection.texture;
              break;
            case "3x2":
              firstTexture = materialData.reflection.texture;
              break;
            case "6x1":
              firstTexture = materialData.reflection.texture;
              break;
            case "separate":
              firstTexture = materialData.reflection.pxTexture;
              break;
          }

          switch (this.reflectionType) {
            case "box-net":
              materialData.reflection = {
                type: this.reflectionType,
                strength,
                texture: firstTexture,
              };
              break;
            case "3x2":
              materialData.reflection = {
                type: this.reflectionType,
                strength,
                texture: firstTexture,
              };
              break;
            case "6x1":
              materialData.reflection = {
                type: this.reflectionType,
                strength,
                texture: firstTexture,
              };
              break;
            case "separate":
              materialData.reflection = {
                type: this.reflectionType,
                strength,
                pxTexture: firstTexture,
              };
              break;
          }
        }
      }
    }

    // 2. Update Babylon state
    // Set the material's reflection texture IF one is fully defined in the override data
    // @NOTE This is currently not possible, since we JUST cleared out any texture data or whatever
    // but we leave it here for forward compatibility?
    if (materialData.reflection !== undefined) {
      ReflectionLoading.load(materialData.reflection, ProjectController.assetCache, MaterialEditorViewController.scene)
        .then((reflection) => {
          materialInstance.overridesFromMaterial.reflectionTexture = reflection?.texture;
        });
    } else {
      materialInstance.overridesFromMaterial.reflectionTexture = undefined;
    }

    // 3. Update JSONC
    if (this.reflectionType !== this.oldReflectionType) {
      const jsonPath = resolvePath((materialDefinition: MaterialDefinition) => materialDefinition.reflection);
      if (materialData.reflection !== undefined) {
        const reflectionDefinition = reflectionDataToDefinition(materialData.reflection);
        MaterialEditorViewController.materialJson.mutate(jsonPath, reflectionDefinition);
      } else {
        MaterialEditorViewController.materialJson.delete(jsonPath);
      }
    }
  }

  public async afterPersistChanges({ ProjectController, MaterialEditorViewController }: MaterialEditorViewMutationArguments): Promise<void> {
    const { materialAssetData, materialData } = MaterialEditorViewController;

    // Update asset in cache
    ProjectController.assetCache.set(materialAssetData.id, (context) => {
      return MaterialAsset.fromMaterialData(materialData, materialAssetData, context);
    });

    // Ensure asset is loaded so that dependencies are up to date
    await ProjectController.assetCache.loadAsset(materialAssetData, MaterialEditorViewController.scene);
  }

  public undo(_args: MaterialEditorViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `Set material reflection type`;
  }
}
