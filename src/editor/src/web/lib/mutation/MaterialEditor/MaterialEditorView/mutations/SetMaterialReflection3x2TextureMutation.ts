import { AssetType, MeshAssetMaterialOverrideReflection3x2Definition } from "@polyzone/runtime/src/cartridge";
import { MaterialAsset, MaterialDefinition, ReflectionLoading } from "@polyzone/runtime/src/world";
import { resolvePath } from "@lib/util/JsoncContainer";
import { IMaterialEditorViewMutation } from "../IMaterialEditorViewMutation";
import { MaterialEditorViewMutationArguments } from "../MaterialEditorViewMutationArguments";

export class SetMaterialReflection3x2TextureMutation implements IMaterialEditorViewMutation {
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

    if (materialData.reflection?.type !== '3x2') {
      throw new Error(`Cannot set reflection texture for material - the material doesn't have the correct reflection type set`);
    }

    // 0. Store undo data
    this.oldReflectionTextureAssetId = materialData.reflection.texture?.id;

    // 1. Update data
    materialData.reflection.texture = reflectionTextureAssetData;

    // 2. Update Babylon state
    if (reflectionTextureAssetData) {
      ReflectionLoading.load3x2(materialData.reflection, ProjectController.assetCache, MaterialEditorViewController.scene)
        .then((reflection) => {
          materialInstance.overridesFromMaterial.reflectionTexture = reflection?.texture;
        });
    } else {
      materialInstance.overridesFromMaterial.reflectionTexture = undefined;
    }

    // 3. Update JSONC
    const jsonPath = resolvePath((materialDefinition: MaterialDefinition) => (materialDefinition.reflection as MeshAssetMaterialOverrideReflection3x2Definition).textureAssetId);
    if (materialData.reflection.texture !== undefined) {
      MaterialEditorViewController.materialJson.mutate(jsonPath, materialData.reflection.texture.id);
    } else {
      MaterialEditorViewController.materialJson.delete(jsonPath);
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
    return `Set material reflection texture`;
  }
}
