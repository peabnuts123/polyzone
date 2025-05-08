
import { AssetType, MeshAssetMaterialOverrideReflection3x2Data } from "@polyzone/runtime/src/cartridge";
import { ReflectionLoading } from "@polyzone/runtime/src/world";
import { IModelEditorViewMutation } from "../IModelEditorViewMutation";
import { ModelEditorViewMutationArguments } from "../ModelEditorViewMutationArguments";
import { reconcileMaterialOverrideData } from "./util/reconcile-overrides";

export class SetModelMaterialOverrideReflection3x2TextureMutation implements IModelEditorViewMutation {
  // Mutation parameters
  private readonly modelAssetId: string;
  private readonly materialName: string;
  private readonly reflectionTextureAssetId: string | undefined;

  // Undo state
  private oldReflectionTextureAssetId: string | undefined;

  public constructor(modelAssetId: string, materialName: string, reflectionTextureAssetId: string | undefined) {
    this.modelAssetId = modelAssetId;
    this.materialName = materialName;
    this.reflectionTextureAssetId = reflectionTextureAssetId;
  }

  public apply({ ProjectController, ModelEditorViewController }: ModelEditorViewMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const reflectionTextureAssetData = this.reflectionTextureAssetId ? ProjectController.project.assets.getById(this.reflectionTextureAssetId, AssetType.Texture) : undefined;
    const materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);
    const material = ModelEditorViewController.getMaterialByName(this.materialName);

    if (materialOverridesData?.reflection?.type !== '3x2') {
      throw new Error(`Cannot set reflection texture for material override - the material doesn't have a reflection override yet`);
    }

    // 0. Store undo data
    this.oldReflectionTextureAssetId = materialOverridesData.reflection.texture?.id;

    // 1. Update data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      (overrides.reflection as MeshAssetMaterialOverrideReflection3x2Data).texture = reflectionTextureAssetData;
    });

    // 2. Update Babylon state
    if (reflectionTextureAssetData) {
      ReflectionLoading.load3x2(
        materialOverridesData.reflection as MeshAssetMaterialOverrideReflection3x2Data,
        {
          assetCache: ModelEditorViewController.assetCache,
          scene: ModelEditorViewController.scene,
          assetDb: ProjectController.project.assets,
        },
      )
        .then((reflectionTexture) => {
          material.overridesFromAsset.reflectionTexture = reflectionTexture;
        });
    } else {
      material.overridesFromAsset.reflectionTexture = undefined;
    }

    // 3. Update JSONC
    reconcileMaterialOverrideData(meshAssetData, ProjectController);
  }

  public undo(_args: ModelEditorViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `Set material reflection texture override`;
  }
}
