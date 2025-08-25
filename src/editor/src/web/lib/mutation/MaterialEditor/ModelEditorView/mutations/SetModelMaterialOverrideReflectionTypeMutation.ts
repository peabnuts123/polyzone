import { BaseModelEditorViewMutation } from "../IModelEditorViewMutation";
import { ModelEditorViewMutationArguments } from "../ModelEditorViewMutationArguments";
import { AssetType, ITextureAssetData, MeshAssetMaterialOverrideReflectionData, MeshAssetMaterialOverrideReflectionType } from "@polyzone/runtime/src/cartridge";
import { reconcileMaterialOverrideData } from "./util/reconcile-overrides";
import { ReflectionLoading } from "@polyzone/runtime/src/world";

interface MutationArgs {
  /**
   * New reflection override type. Will be ignored if `priorReflectionOverrideData` is set.
   */
  reflectionType?: MeshAssetMaterialOverrideReflectionType;
  /**
   * Used by Undo.
   * Setting this field will replace the entire reflection override. `reflectionType` will be ignored.
   */
  priorReflectionOverrideData?: MeshAssetMaterialOverrideReflectionData;
}

export class SetModelMaterialOverrideReflectionTypeMutation extends BaseModelEditorViewMutation<MutationArgs> {
  private readonly modelAssetId: string;
  private readonly materialName: string;

  public constructor(modelAssetId: string, materialName: string, reflectionType: MeshAssetMaterialOverrideReflectionType | undefined) {
    super({ reflectionType });
    this.modelAssetId = modelAssetId;
    this.materialName = materialName;
  }

  public async apply({ ProjectController, ModelEditorViewController }: ModelEditorViewMutationArguments, mutationArgs: MutationArgs): Promise<void> {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    let materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);
    const material = ModelEditorViewController.getMaterialByName(this.materialName);

    if (
      !('reflectionType' in mutationArgs) &&
      !('priorReflectionOverrideData' in mutationArgs)) {
      throw new Error(`One of 'reflectionType' or 'priorReflectionOverrideData' mutation args must be provided`);
    }

    const { reflectionType, priorReflectionOverrideData } = mutationArgs;

    // 1. Update data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      // Re-instate prior reflection override data (if provided, takes precedence over `reflectionType`)
      if (priorReflectionOverrideData !== undefined) {
        overrides.reflection = priorReflectionOverrideData;
        return;
      }

      if (overrides.reflection?.type !== reflectionType) {
        if (reflectionType === undefined) {
          // Clear all reflection state
          overrides.reflection = undefined;
        } else {
          // Create a new reflection data object

          if (overrides.reflection?.type === undefined) {
            // No previous data - create new blank
            overrides.reflection = {
              type: reflectionType,
            };
          } else {
            // Copy any existing data from previous config
            let firstTexture: ITextureAssetData | undefined;
            const strength = overrides.reflection.strength;
            switch (overrides.reflection.type) {
              case "box-net":
                firstTexture = overrides.reflection.texture;
                break;
              case "3x2":
                firstTexture = overrides.reflection.texture;
                break;
              case "6x1":
                firstTexture = overrides.reflection.texture;
                break;
              case "separate":
                firstTexture = overrides.reflection.pxTexture;
                break;
            }

            switch (reflectionType) {
              case "box-net":
                overrides.reflection = {
                  type: reflectionType,
                  strength,
                  texture: firstTexture,
                };
                break;
              case "3x2":
                overrides.reflection = {
                  type: reflectionType,
                  strength,
                  texture: firstTexture,
                };
                break;
              case "6x1":
                overrides.reflection = {
                  type: reflectionType,
                  strength,
                  texture: firstTexture,
                };
                break;
              case "separate":
                overrides.reflection = {
                  type: reflectionType,
                  strength,
                  pxTexture: firstTexture,
                };
                break;
            }
          }
        }
      }
    });

    // 2. Update Babylon state
    materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName)!;
    // Set the material's reflection texture IF one is fully defined in the override data
    // @NOTE This is currently not possible, since we JUST cleared out any texture data or whatever
    // but we leave it here for forward compatibility?
    if (materialOverridesData.reflection !== undefined) {
      const reflection = await ReflectionLoading.load(materialOverridesData.reflection, ProjectController.assetCache, ModelEditorViewController.scene);
      material.overridesFromAsset.reflectionTexture = reflection?.texture;
    } else {
      material.overridesFromAsset.reflectionTexture = undefined;
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

  public getUndoArgs({ ProjectController }: ModelEditorViewMutationArguments): MutationArgs {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);

    // @NOTE Undo data is different than the typical mutation arg.
    // `priorReflectionOverrideData` takes precedence over `reflectionType`, and will
    // replace the entire reflection material override
    if (materialOverridesData?.reflection !== undefined) {
      return {
        priorReflectionOverrideData: {
          ...materialOverridesData.reflection,
        },
      };
    } else {
      return {
        priorReflectionOverrideData: undefined,
      };
    }
  }

  public get description(): string {
    return `Set material reflection type override`;
  }
}
