import { IModelEditorViewMutation } from "../IModelEditorViewMutation";
import { ModelEditorViewMutationArguments } from "../ModelEditorViewMutationArguments";
import { AssetType, ITextureAssetData, MeshAssetMaterialOverrideReflectionType } from "@polyzone/runtime/src/cartridge";
import { reconcileMaterialOverrideData } from "./util/reconcile-overrides";
import { ReflectionLoading } from "@polyzone/runtime/src/world";

export class SetModelMaterialOverrideReflectionTypeMutation implements IModelEditorViewMutation {
  // Mutation parameters
  private readonly modelAssetId: string;
  private readonly materialName: string;
  private readonly reflectionType: MeshAssetMaterialOverrideReflectionType | undefined;

  // Undo state
  private oldReflectionType: MeshAssetMaterialOverrideReflectionType | undefined;

  public constructor(modelAssetId: string, materialName: string, reflectionType: MeshAssetMaterialOverrideReflectionType | undefined) {
    this.modelAssetId = modelAssetId;
    this.materialName = materialName;
    this.reflectionType = reflectionType;
  }

  public apply({ ProjectController, ModelEditorViewController }: ModelEditorViewMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    let materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);
    const material = ModelEditorViewController.getMaterialByName(this.materialName);

    // 0. Store undo data
    this.oldReflectionType = materialOverridesData?.reflection?.type;

    // 1. Update data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      if (overrides.reflection?.type !== this.reflectionType) {
        // @NOTE Clear any other data (even though some of it COULD possibly copy across e.g. texture)
        if (this.reflectionType === undefined) {
          overrides.reflection = undefined;
        } else {
          // Create a new reflection data object

          // No previous data - create new blank
          if (overrides.reflection?.type === undefined) {
            overrides.reflection = {
              type: this.reflectionType,
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

            switch (this.reflectionType) {
              case "box-net":
                overrides.reflection = {
                  type: this.reflectionType,
                  strength,
                  texture: firstTexture,
                };
                break;
              case "3x2":
                overrides.reflection = {
                  type: this.reflectionType,
                  strength,
                  texture: firstTexture,
                };
                break;
              case "6x1":
                overrides.reflection = {
                  type: this.reflectionType,
                  strength,
                  texture: firstTexture,
                };
                break;
              case "separate":
                overrides.reflection = {
                  type: this.reflectionType,
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
      ReflectionLoading.load(materialOverridesData.reflection, ProjectController.assetCache, ModelEditorViewController.scene)
        .then((reflection) => {
          material.overridesFromAsset.reflectionTexture = reflection?.texture;
        });
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

  public undo(_args: ModelEditorViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `Set material reflection type override`;
  }
}
