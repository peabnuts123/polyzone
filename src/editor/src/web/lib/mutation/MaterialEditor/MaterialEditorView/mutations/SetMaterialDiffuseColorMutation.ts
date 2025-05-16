import { Color3 as Color3Babylon } from '@babylonjs/core/Maths/math.color';
import { Color3 } from "@polyzone/core/src/util";
import { toColor3Babylon, toColor3Definition } from "@polyzone/runtime/src/util";
import { MaterialAsset, MaterialDefinition } from "@polyzone/runtime/src/world";
import { resolvePath } from "@lib/util/JsoncContainer";
import { IContinuousMaterialEditorViewMutation } from "../IContinuousMaterialEditorViewMutation";
import { IMaterialEditorViewMutation } from "../IMaterialEditorViewMutation";
import { MaterialEditorViewMutationArguments } from "../MaterialEditorViewMutationArguments";

export interface SetMaterialDiffuseColorMutationUpdateArgs {
  diffuseColor: Color3;
}

export class SetMaterialDiffuseColorMutation implements IMaterialEditorViewMutation, IContinuousMaterialEditorViewMutation<SetMaterialDiffuseColorMutationUpdateArgs> {
  // State
  private _hasBeenApplied: boolean = false;

  // Undo state
  private dataDiffuseColor: Color3 | undefined = undefined;
  private sceneDiffuseColor: Color3Babylon | undefined = undefined;

  public begin({ MaterialEditorViewController }: MaterialEditorViewMutationArguments): void {
    const { materialData, materialInstance } = MaterialEditorViewController;

    // - Store undo values
    this.dataDiffuseColor = materialData.diffuseColor;
    this.sceneDiffuseColor = materialInstance.overridesFromMaterial.diffuseColor;
  }

  public update({ MaterialEditorViewController }: MaterialEditorViewMutationArguments, { diffuseColor }: SetMaterialDiffuseColorMutationUpdateArgs): void {
    const { materialData, materialInstance } = MaterialEditorViewController;

    // - 1. Data
    materialData.diffuseColor = diffuseColor;
    // - 2. Babylon state
    materialInstance.overridesFromMaterial.diffuseColor = toColor3Babylon(diffuseColor);
  }

  public apply({ MaterialEditorViewController }: MaterialEditorViewMutationArguments): void {
    const { materialData } = MaterialEditorViewController;

    // 3. Update JSONC
    const jsonPath = resolvePath((materialDefinition: MaterialDefinition) => materialDefinition.diffuseColor);
    if (materialData.diffuseColor !== undefined) {
      MaterialEditorViewController.materialJson.mutate(jsonPath, toColor3Definition(materialData.diffuseColor));
    } else {
      MaterialEditorViewController.materialJson.delete(jsonPath);
    }
  }

  public async afterPersistChanges({ ProjectController, MaterialEditorViewController }: MaterialEditorViewMutationArguments): Promise<void> {
    const { materialAssetData, materialData } = MaterialEditorViewController;

    // Update asset in cache
    ProjectController.assetCache.set(materialAssetData.id, (context) => {
      return MaterialAsset.fromMaterialData(materialData, materialAssetData, context);
    });

    // Ensure asset is loaded so that dependencies are up to date
    await ProjectController.assetCache.loadAsset(materialAssetData, MaterialEditorViewController.scene);
  }

  public undo(_args: MaterialEditorViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `Set material diffuse color`;
  }

  public get hasBeenApplied(): boolean { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}
