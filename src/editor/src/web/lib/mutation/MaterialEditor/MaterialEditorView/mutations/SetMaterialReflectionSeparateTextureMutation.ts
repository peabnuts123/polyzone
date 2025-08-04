import { AssetType, MeshAssetMaterialOverrideReflectionSeparateDefinition } from "@polyzone/runtime/src/cartridge";
import { MaterialAsset, MaterialDefinition, ReflectionLoading } from "@polyzone/runtime/src/world";
import { resolvePath } from "@lib/util/JsoncContainer";
import { ReflectionSeparateTexture, getTextureData, setTextureData } from '@lib/mutation/MaterialEditor/ModelEditorView/mutations/SetModelMaterialOverrideReflectionSeparateTextureMutation';
import { IMaterialEditorViewMutation } from "../IMaterialEditorViewMutation";
import { MaterialEditorViewMutationArguments } from "../MaterialEditorViewMutationArguments";

export class SetMaterialReflectionSeparateTextureMutation implements IMaterialEditorViewMutation {
  // Mutation parameters
  private readonly reflectionTextureAssetId: string | undefined;
  private readonly whichTexture: ReflectionSeparateTexture;

  // Undo state
  private oldReflectionTextureAssetId: string | undefined;

  public constructor(reflectionTextureAssetId: string | undefined, whichTexture: ReflectionSeparateTexture) {
    this.reflectionTextureAssetId = reflectionTextureAssetId;
    this.whichTexture = whichTexture;
  }

  public async apply({ ProjectController, MaterialEditorViewController }: MaterialEditorViewMutationArguments): Promise<void> {
    const reflectionTextureAssetData = this.reflectionTextureAssetId ? ProjectController.project.assets.getById(this.reflectionTextureAssetId, AssetType.Texture) : undefined;
    const { materialData, materialInstance } = MaterialEditorViewController;


    if (materialData.reflection?.type !== 'separate') {
      throw new Error(`Cannot set reflection texture for material - the material doesn't have the correct reflection type set`);
    }

    // 0. Store undo data
    this.oldReflectionTextureAssetId = getTextureData(materialData.reflection, this.whichTexture)?.id;

    // 1. Update data
    setTextureData(materialData.reflection, this.whichTexture, reflectionTextureAssetData);

    // 2. Update Babylon state
    if (reflectionTextureAssetData) {
      /* @NOTE Will only return a defined texture when all 6 textures are defined */
      const reflection = await ReflectionLoading.loadSeparate(materialData.reflection, ProjectController.assetCache, MaterialEditorViewController.scene);
      materialInstance.overridesFromMaterial.reflectionTexture = reflection?.texture;
    } else {
      materialInstance.overridesFromMaterial.reflectionTexture = undefined;
    }

    // 3. Update JSONC
    const jsonPath = resolvePath((materialDefinition: MaterialDefinition) => {
      const reflectionDefinition = materialDefinition.reflection as MeshAssetMaterialOverrideReflectionSeparateDefinition;
      switch (this.whichTexture) {
        case ReflectionSeparateTexture.positiveX: return reflectionDefinition.pxTextureAssetId;
        case ReflectionSeparateTexture.negativeX: return reflectionDefinition.nxTextureAssetId;
        case ReflectionSeparateTexture.positiveY: return reflectionDefinition.pyTextureAssetId;
        case ReflectionSeparateTexture.negativeY: return reflectionDefinition.nyTextureAssetId;
        case ReflectionSeparateTexture.positiveZ: return reflectionDefinition.pzTextureAssetId;
        case ReflectionSeparateTexture.negativeZ: return reflectionDefinition.nzTextureAssetId;
        default:
          throw new Error(`Unimplemented separate reflection type: ${this.whichTexture}`);
      }
    });
    if (this.reflectionTextureAssetId !== undefined) {
      MaterialEditorViewController.materialJson.mutate(jsonPath, this.reflectionTextureAssetId);
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
