import { AssetType } from "@polyzone/runtime/src/cartridge";
import { IModelEditorViewMutation } from "../IModelEditorViewMutation";
import { ModelEditorViewMutationArguments } from "../ModelEditorViewMutationArguments";
import { reconcileMaterialOverrideData } from "./util/reconcile-overrides";
import { IContinuousModelEditorViewMutation } from "../IContinuousModelEditorViewMutation";

export interface SetModelMaterialOverrideReflectionStrengthMutationUpdateArgs {
  reflectionStrength: number;
}

export class SetModelMaterialOverrideReflectionStrengthMutation implements IModelEditorViewMutation, IContinuousModelEditorViewMutation<SetModelMaterialOverrideReflectionStrengthMutationUpdateArgs> {
  // Mutation parameters
  private readonly modelAssetId: string;
  private readonly materialName: string;

  // State
  private _hasBeenApplied: boolean = false;

  // Undo state
  private oldReflectionStrength: number | undefined;

  public constructor(modelAssetId: string, materialName: string) {
    this.modelAssetId = modelAssetId;
    this.materialName = materialName;
  }

  public begin({ ProjectController }: ModelEditorViewMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);

    if (materialOverridesData?.reflection?.type === undefined) {
      throw new Error(`Cannot set reflection strength for material override - the material doesn't have a reflection override yet`);
    }

    // 0. Store undo data
    this.oldReflectionStrength = materialOverridesData?.reflection?.strength;
  }

  public update({ ProjectController, ModelEditorViewController }: ModelEditorViewMutationArguments, { reflectionStrength }: SetModelMaterialOverrideReflectionStrengthMutationUpdateArgs): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const material = ModelEditorViewController.getMaterialByName(this.materialName);

    // 1. Update data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      overrides.reflection!.strength = reflectionStrength;
    });

    // 2. Update Babylon state
    if (material.overridesFromAsset.reflectionTexture) {
      material.overridesFromAsset.reflectionTexture.level = reflectionStrength;
    }
  }

  public apply({ ProjectController }: ModelEditorViewMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);

    // 3. Update JSONC
    reconcileMaterialOverrideData(meshAssetData, ProjectController);
  }

  public undo(_args: ModelEditorViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `Set material reflection strength override`;
  }

  public get hasBeenApplied(): boolean { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}
