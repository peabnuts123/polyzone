import { AssetType, MeshAssetMaterialOverrideReflectionSeparateDefinition } from "@polyzone/runtime/src/cartridge";
import { MaterialAsset, MaterialDefinition, ReflectionLoading } from "@polyzone/runtime/src/world";
import { resolvePath } from "@lib/util/JsoncContainer";
import { ReflectionSeparateTexture, getTextureData, setTextureData } from '@lib/mutation/MaterialEditor/ModelEditorView/mutations/SetModelMaterialOverrideReflectionSeparateTextureMutation';
import { BaseMaterialEditorViewMutation } from "../IMaterialEditorViewMutation";
import { MaterialEditorViewMutationArguments } from "../MaterialEditorViewMutationArguments";

interface MutationArgs {
  reflectionTextureAssetId: string | undefined;
}

export class SetMaterialReflectionSeparateTextureMutation extends BaseMaterialEditorViewMutation<MutationArgs> {
  // Mutation parameters
  private readonly whichTexture: ReflectionSeparateTexture;

  public constructor(reflectionTextureAssetId: string | undefined, whichTexture: ReflectionSeparateTexture) {
    super({ reflectionTextureAssetId });
    this.whichTexture = whichTexture;
  }

  public async apply({ ProjectController, MaterialEditorViewController }: MaterialEditorViewMutationArguments, { reflectionTextureAssetId }: MutationArgs): Promise<void> {
    const reflectionTextureAssetData = reflectionTextureAssetId ? ProjectController.project.assets.getById(reflectionTextureAssetId, AssetType.Texture) : undefined;
    const { materialData, materialInstance } = MaterialEditorViewController;

    if (materialData.reflection?.type !== 'separate') {
      throw new Error(`Cannot set reflection texture for material - the material doesn't have the correct reflection type set`);
    }

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
    if (reflectionTextureAssetId !== undefined) {
      MaterialEditorViewController.materialJson.mutate(jsonPath, reflectionTextureAssetId);
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

  public getUndoArgs({ MaterialEditorViewController }: MaterialEditorViewMutationArguments): MutationArgs {
    const { materialData } = MaterialEditorViewController;

    if (materialData.reflection?.type !== 'separate') {
      throw new Error(`Cannot capture undo state - the material doesn't have the correct reflection type set`);
    }

    return {
      reflectionTextureAssetId: getTextureData(materialData.reflection, this.whichTexture)?.id,
    };
  }

  public get description(): string {
    return `Set material reflection texture`;
  }
}
