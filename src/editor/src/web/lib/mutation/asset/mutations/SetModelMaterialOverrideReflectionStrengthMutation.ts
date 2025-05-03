import { AssetType } from "@polyzone/runtime/src/cartridge";
import { IModelMaterialMutation } from "../IModelMaterialMutation";
import { ModelMaterialMutationArguments } from "../ModelMaterialMutationArguments";
import { reconcileMaterialOverrideData } from "./util/reconcile-overrides";
import { IContinuousModelMaterialMutation } from "../IContinuousModelMaterialMutation";

export interface SetModelMaterialOverrideReflectionStrengthMutationUpdateArgs {
  reflectionStrength: number;
}

export class SetModelMaterialOverrideReflectionStrengthMutation implements IModelMaterialMutation, IContinuousModelMaterialMutation<SetModelMaterialOverrideReflectionStrengthMutationUpdateArgs> {
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

  public begin({ ProjectController }: ModelMaterialMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);

    if (materialOverridesData?.reflection?.type === undefined) {
      throw new Error(`Cannot set reflection strength for material override - the material doesn't have a reflection override yet`);
    }

    // 0. Store undo data
    this.oldReflectionStrength = materialOverridesData?.reflection?.strength;
  }

  public update({ ProjectController, ModelMaterialEditorController }: ModelMaterialMutationArguments, { reflectionStrength }: SetModelMaterialOverrideReflectionStrengthMutationUpdateArgs): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const material = ModelMaterialEditorController.getMaterialByName(this.materialName);

    // 1. Update data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      overrides.reflection!.strength = reflectionStrength;
    });

    // 2. Update Babylon state
    if (material.overrides.reflectionTexture) {
      material.overrides.reflectionTexture.level = reflectionStrength;
    }
  }

  public apply({ ProjectController }: ModelMaterialMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);

    // 3. Update JSONC
    reconcileMaterialOverrideData(meshAssetData, ProjectController);
  }

  public undo(_args: ModelMaterialMutationArguments): void {
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
