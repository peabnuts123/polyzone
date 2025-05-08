import { AssetType, MeshAssetMaterialOverrideReflection6x1Definition } from "@polyzone/runtime/src/cartridge";
import { MaterialDefinition, ReflectionLoading } from "@polyzone/runtime/src/world";
import { resolvePath } from "@lib/util/JsoncContainer";
import { IMaterialEditorViewMutation } from "../IMaterialEditorViewMutation";
import { MaterialEditorViewMutationArguments } from "../MaterialEditorViewMutationArguments";

export class SetMaterialReflection6x1TextureMutation implements IMaterialEditorViewMutation {
  // Mutation parameters
  private readonly reflectionTextureAssetId: string | undefined;

  // Undo state
  private oldReflectionTextureAssetId: string | undefined;

  public constructor(reflectionTextureAssetId: string | undefined) {
    this.reflectionTextureAssetId = reflectionTextureAssetId;
  }

  public apply({ ProjectController, MaterialEditorViewController }: MaterialEditorViewMutationArguments): void {
    const reflectionTextureAssetData = this.reflectionTextureAssetId ? ProjectController.project.assets.getById(this.reflectionTextureAssetId, AssetType.Texture) : undefined;
    const { materialData, materialInstance } = MaterialEditorViewController;

    if (materialData.reflection?.type !== '6x1') {
      throw new Error(`Cannot set reflection texture for material - the material doesn't have the correct reflection type set`);
    }

    // 0. Store undo data
    this.oldReflectionTextureAssetId = materialData.reflection.texture?.id;

    // 1. Update data
    materialData.reflection.texture = reflectionTextureAssetData;

    // 2. Update Babylon state
    if (reflectionTextureAssetData) {
      ReflectionLoading.load6x1(
        materialData.reflection,
        {
          assetCache: MaterialEditorViewController.assetCache,
          scene: MaterialEditorViewController.scene,
          assetDb: ProjectController.project.assets,
        },
      )
        .then((reflectionTexture) => {
          materialInstance.overridesFromMaterial.reflectionTexture = reflectionTexture;
        });
    } else {
      materialInstance.overridesFromMaterial.reflectionTexture = undefined;
    }

    // 3. Update JSONC
    const jsonPath = resolvePath((materialDefinition: MaterialDefinition) => (materialDefinition.reflection as MeshAssetMaterialOverrideReflection6x1Definition).textureAssetId);
    if (materialData.reflection.texture !== undefined) {
      MaterialEditorViewController.materialJson.mutate(jsonPath, materialData.reflection.texture.id);
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
    return `Set material reflection texture`;
  }
}
