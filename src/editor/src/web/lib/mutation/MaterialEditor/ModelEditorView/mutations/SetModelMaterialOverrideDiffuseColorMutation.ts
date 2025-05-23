import { Color3 } from "@polyzone/core/src/util";
import { Color3 as Color3Babylon } from '@babylonjs/core/Maths/math.color';
import { IContinuousModelEditorViewMutation } from "../IContinuousModelEditorViewMutation";
import { IModelEditorViewMutation } from "../IModelEditorViewMutation";
import { ModelEditorViewMutationArguments } from "../ModelEditorViewMutationArguments";
import { AssetType } from "@polyzone/runtime/src/cartridge";
import { toColor3Babylon } from "@polyzone/runtime/src/util";
import { reconcileMaterialOverrideData } from "./util/reconcile-overrides";


export interface SetModelMaterialOverrideDiffuseColorMutationUpdateArgs {
  diffuseColor: Color3;
}

export class SetModelMaterialOverrideDiffuseColorMutation implements IModelEditorViewMutation, IContinuousModelEditorViewMutation<SetModelMaterialOverrideDiffuseColorMutationUpdateArgs> {
  // Mutation parameters
  private readonly modelAssetId: string;
  private readonly materialName: string;

  // State
  private _hasBeenApplied: boolean = false;

  // Undo state
  private dataDiffuseColor: Color3 | undefined = undefined;
  private sceneDiffuseColor: Color3Babylon | undefined = undefined;

  public constructor(modelAssetId: string, materialName: string) {
    this.modelAssetId = modelAssetId;
    this.materialName = materialName;
  }

  public begin({ ProjectController, ModelEditorViewController }: ModelEditorViewMutationArguments): void {
    // Data
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);
    // Scene
    const material = ModelEditorViewController.getMaterialByName(this.materialName);

    // - Store undo values
    this.dataDiffuseColor = materialOverridesData?.diffuseColor;
    this.sceneDiffuseColor = material.overridesFromAsset.diffuseColor;
  }

  public update({ ProjectController, ModelEditorViewController }: ModelEditorViewMutationArguments, { diffuseColor }: SetModelMaterialOverrideDiffuseColorMutationUpdateArgs): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const material = ModelEditorViewController.getMaterialByName(this.materialName);

    // - 1. Data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      overrides.diffuseColor = diffuseColor;
    });
    // - 2. Babylon state
    material.overridesFromAsset.diffuseColor = toColor3Babylon(diffuseColor);
  }

  public apply({ ProjectController }: ModelEditorViewMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);

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
    return `Set material diffuse color override`;
  }

  public get hasBeenApplied(): boolean { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}
