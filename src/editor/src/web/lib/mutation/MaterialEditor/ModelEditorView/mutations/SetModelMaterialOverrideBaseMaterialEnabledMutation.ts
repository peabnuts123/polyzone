
import { IModelEditorViewMutation } from "../IModelEditorViewMutation";
import { ModelEditorViewMutationArguments } from "../ModelEditorViewMutationArguments";
import { AssetType } from "@polyzone/runtime/src/cartridge";
import { reconcileMaterialOverrideData } from "./util/reconcile-overrides";

export class SetModelMaterialOverrideBaseMaterialEnabledMutation implements IModelEditorViewMutation {
  // Mutation parameters
  private readonly modelAssetId: string;
  private readonly materialName: string;
  private readonly baseMaterialEnabled: boolean;

  // Undo state
  private oldBaseMaterialEnabled: boolean | undefined;

  public constructor(modelAssetId: string, materialName: string, baseMaterialEnabled: boolean) {
    this.modelAssetId = modelAssetId;
    this.materialName = materialName;
    this.baseMaterialEnabled = baseMaterialEnabled;
  }

  public apply({ ProjectController, ModelEditorViewController }: ModelEditorViewMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    let materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);
    const material = ModelEditorViewController.getMaterialByName(this.materialName);

    // 0. Store undo data
    this.oldBaseMaterialEnabled = materialOverridesData?.materialEnabled;

    // 1. Update data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      overrides.materialEnabled = this.baseMaterialEnabled;
    });

    // 2. Update Babylon state
    materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName)!;
    if (this.baseMaterialEnabled) {
      // Enabling override
      if (materialOverridesData.material !== undefined) {
        ProjectController.assetCache.loadAsset(materialOverridesData.material, ModelEditorViewController.scene)
          .then((materialAsset) => {
            material.readOverridesFromMaterial(materialAsset);
          });
      }
    } else {
      // Disabling override
      material.readOverridesFromMaterial(undefined);
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
    return `${this.baseMaterialEnabled ? "Enable" : "Disable"} base material override`;
  }
}
