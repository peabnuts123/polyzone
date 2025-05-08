
import { IModelEditorViewMutation } from "../IModelEditorViewMutation";
import { ModelEditorViewMutationArguments } from "../ModelEditorViewMutationArguments";
import { AssetType } from "@polyzone/runtime/src/cartridge";
import { toColor3Babylon, toColor3Core } from "@polyzone/runtime/src/util";
import { RetroMaterial } from "@polyzone/runtime/src/materials/RetroMaterial";
import { reconcileMaterialOverrideData } from "./util/reconcile-overrides";

export class SetModelMaterialOverrideEmissionColorEnabledMutation implements IModelEditorViewMutation {
  // Mutation parameters
  private readonly modelAssetId: string;
  private readonly materialName: string;
  private readonly emissionColorEnabled: boolean;

  // Undo state
  private oldEmissionColorEnabled: boolean | undefined;

  public constructor(modelAssetId: string, materialName: string, emissionColorEnabled: boolean) {
    this.modelAssetId = modelAssetId;
    this.materialName = materialName;
    this.emissionColorEnabled = emissionColorEnabled;
  }

  public apply({ ProjectController, ModelEditorViewController }: ModelEditorViewMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    let materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);
    const material = ModelEditorViewController.getMaterialByName(this.materialName);

    // 0. Store undo data
    this.oldEmissionColorEnabled = materialOverridesData?.emissionColorEnabled;

    // 1. Update data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      overrides.emissionColorEnabled = this.emissionColorEnabled;
      if (this.emissionColorEnabled) {
        // Also ensure color override is set if we're enabling it
        overrides.emissionColor ??= toColor3Core(RetroMaterial.Defaults.emissiveColor);
      }
    });

    // 2. Update Babylon state
    materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName)!;
    if (this.emissionColorEnabled) {
      // Enabling override
      // Since we made sure the override had a color if it was enabled,
      // we know that there MUST be a value in the overrides data at this point
      material.overridesFromAsset.emissionColor = toColor3Babylon(materialOverridesData.emissionColor!);
    } else {
      // Disabling override - remove color from material
      material.overridesFromAsset.emissionColor = undefined;
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
    return `${this.emissionColorEnabled ? "Enable" : "Disable"} material emission color override`;
  }
}
