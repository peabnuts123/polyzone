
import { AssetType } from "@polyzone/runtime/src/cartridge";
import { IModelEditorViewMutation } from "../IModelEditorViewMutation";
import { ModelEditorViewMutationArguments } from "../ModelEditorViewMutationArguments";
import { reconcileMaterialOverrideData } from "./util/reconcile-overrides";

export class SetModelMaterialOverrideBaseMaterialMutation implements IModelEditorViewMutation {
  // Mutation parameters
  private readonly modelAssetId: string;
  private readonly materialName: string;
  private readonly baseMaterialAssetId: string | undefined;

  // Undo state
  private oldBaseMaterialAssetId: string | undefined;

  public constructor(modelAssetId: string, materialName: string, baseMaterialAssetId: string | undefined) {
    this.modelAssetId = modelAssetId;
    this.materialName = materialName;
    this.baseMaterialAssetId = baseMaterialAssetId;
  }

  public apply({ ProjectController, ModelEditorViewController }: ModelEditorViewMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const baseMaterialAssetData = this.baseMaterialAssetId ? ProjectController.project.assets.getById(this.baseMaterialAssetId, AssetType.Material) : undefined;
    let materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);
    const material = ModelEditorViewController.getMaterialByName(this.materialName);

    // 0. Store undo data
    this.oldBaseMaterialAssetId = materialOverridesData?.material?.id;

    // 1. Update data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      overrides.material = baseMaterialAssetData;
    });

    // 2. Update Babylon state
    materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName)!;
    if (baseMaterialAssetData) {
      if (materialOverridesData.material !== undefined) {
        ModelEditorViewController.assetCache.loadAsset(
          materialOverridesData.material,
          {
            scene: ModelEditorViewController.scene,
            assetDb: ProjectController.project.assets,
          },
        ).then((materialAsset) => {
          material.readOverridesFromMaterial(materialAsset);
        });
      }
    } else {
      material.readOverridesFromMaterial(undefined);
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
    return `Set material base material override`;
  }
}
