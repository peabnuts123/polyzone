
import { Color3 } from "@polyzone/core/src/util";
import { Color3 as Color3Babylon } from '@babylonjs/core/Maths/math.color';
import { IContinuousModelMaterialMutation } from "../IContinuousModelMaterialMutation";
import { IModelMaterialMutation } from "../IModelMaterialMutation";
import { ModelMaterialMutationArguments } from "../ModelMaterialMutationArguments";
import { AssetType } from "@polyzone/runtime/src/cartridge";
import { toColor3Babylon, toColor3Definition } from "@polyzone/runtime/src/util";
import { resolvePathForAssetMutation } from "@lib/mutation/util";
import { MeshAssetDefinition } from "@lib/project";


export interface SetModelMaterialOverrideDiffuseColorMutationUpdateArgs {
  diffuseColor: Color3;
}

export class SetModelMaterialOverrideDiffuseColorMutation implements IModelMaterialMutation, IContinuousModelMaterialMutation<SetModelMaterialOverrideDiffuseColorMutationUpdateArgs> {
  // Mutation parameters
  private readonly modelAssetId: string;
  private readonly materialName: string;
  private diffuseColor: Color3 | undefined;

  // State
  private _hasBeenApplied: boolean = false;

  // Undo state
  private dataDiffuseColor: Color3 | undefined = undefined;
  private sceneDiffuseColor: Color3Babylon | undefined = undefined;

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
    this.dataDiffuseColor = materialOverridesData?.diffuseColor;
    this.sceneDiffuseColor = material.diffuseColor;
  }

  public update({ ProjectController, ModelMaterialEditorController }: ModelMaterialMutationArguments, { diffuseColor }: SetModelMaterialOverrideDiffuseColorMutationUpdateArgs): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const material = ModelMaterialEditorController.getMaterialByName(this.materialName);

    this.diffuseColor = diffuseColor;
    // - 1. Data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      overrides.diffuseColor = this.diffuseColor;
    });
    // - 2. Babylon state
    material.diffuseColor = toColor3Babylon(diffuseColor);
  }

  public apply({ ProjectController, ModelMaterialEditorController }: ModelMaterialMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const material = ModelMaterialEditorController.getMaterialByName(this.materialName);

    // 1. Update data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      overrides.diffuseColor = this.diffuseColor;
    });

    // 2. Update Babylon state
    material.diffuseColor = this.diffuseColor ? toColor3Babylon(this.diffuseColor) : undefined;

    // 3. Update JSONC
    const mutationPath = resolvePathForAssetMutation(
      this.modelAssetId,
      ProjectController.projectDefinition,
      (meshAsset) => (meshAsset as MeshAssetDefinition).materialOverrides![this.materialName].diffuseColor,
    );

    // @TODO better handle setting the override to null (i.e. remove properties)
    if (this.diffuseColor) {
      ProjectController.projectJson.mutate(mutationPath, toColor3Definition(this.diffuseColor));
    } else {
      ProjectController.projectJson.delete(mutationPath);
    }
  }

  public undo(_args: ModelMaterialMutationArguments): void {
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
