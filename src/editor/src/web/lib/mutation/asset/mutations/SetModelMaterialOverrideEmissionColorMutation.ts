
import { Color3 } from "@polyzone/core/src/util";
import { Color3 as Color3Babylon } from '@babylonjs/core/Maths/math.color';
import { IContinuousModelMaterialMutation } from "../IContinuousModelMaterialMutation";
import { IModelMaterialMutation } from "../IModelMaterialMutation";
import { ModelMaterialMutationArguments } from "../ModelMaterialMutationArguments";
import { AssetType } from "@polyzone/runtime/src/cartridge";
import { toColor3Babylon } from "@polyzone/runtime/src/util";
import { reconcileMaterialOverrideData } from "./util/reconcile-overrides";


export interface SetModelMaterialOverrideEmissionColorMutationUpdateArgs {
  emissionColor: Color3;
}

export class SetModelMaterialOverrideEmissionColorMutation implements IModelMaterialMutation, IContinuousModelMaterialMutation<SetModelMaterialOverrideEmissionColorMutationUpdateArgs> {
  // Mutation parameters
  private readonly modelAssetId: string;
  private readonly materialName: string;
  private emissionColor: Color3 | undefined;

  // State
  private _hasBeenApplied: boolean = false;

  // Undo state
  private dataEmissionColor: Color3 | undefined = undefined;
  private sceneEmissionColor: Color3Babylon | undefined = undefined;

  public constructor(modelAssetId: string, materialName: string) {
    this.modelAssetId = modelAssetId;
    this.materialName = materialName;
  }

  public begin({ ProjectController, ModelMaterialEditorController }: ModelMaterialMutationArguments): void {
    // Data
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);
    // Scene
    const material = ModelMaterialEditorController.getMaterialByName(this.materialName);

    // - Store undo values
    this.dataEmissionColor = materialOverridesData?.emissionColor;
    this.sceneEmissionColor = material.overrides.emissionColor;
  }

  public update({ ProjectController, ModelMaterialEditorController }: ModelMaterialMutationArguments, { emissionColor }: SetModelMaterialOverrideEmissionColorMutationUpdateArgs): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const material = ModelMaterialEditorController.getMaterialByName(this.materialName);

    this.emissionColor = emissionColor;
    // - 1. Data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      overrides.emissionColor = this.emissionColor;
    });
    // - 2. Babylon state
    material.overrides.emissionColor = toColor3Babylon(emissionColor);
  }

  public apply({ ProjectController, ModelMaterialEditorController }: ModelMaterialMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const material = ModelMaterialEditorController.getMaterialByName(this.materialName);

    const emissionColor = this.emissionColor;
    if (emissionColor === undefined) {
      throw new Error(`Can't set emission color override to undefined - did you call \`update()\`?`);
    }

    // 1. Update data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      overrides.emissionColor = emissionColor;
    });

    // 2. Update Babylon state
    material.overrides.emissionColor = toColor3Babylon(emissionColor);

    // 3. Update JSONC
    reconcileMaterialOverrideData(meshAssetData, ProjectController);
  }

  public undo(_args: ModelMaterialMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `Set material emission color override`;
  }

  public get hasBeenApplied(): boolean { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}
