import { Color3 as Color3Babylon } from '@babylonjs/core/Maths/math.color';
import { Color3 } from "@polyzone/core/src/util";
import { toColor3Babylon, toColor3Core } from "@polyzone/runtime/src/util";
import { MaterialDefinition } from "@polyzone/runtime/src/world";
import { resolvePath } from "@lib/util/JsoncContainer";
import { IContinuousMaterialEditorViewMutation } from "../IContinuousMaterialEditorViewMutation";
import { IMaterialEditorViewMutation } from "../IMaterialEditorViewMutation";
import { MaterialEditorViewMutationArguments } from "../MaterialEditorViewMutationArguments";

export interface SetMaterialEmissionColorMutationUpdateArgs {
  emissionColor: Color3;
}

export class SetMaterialEmissionColorMutation implements IMaterialEditorViewMutation, IContinuousMaterialEditorViewMutation<SetMaterialEmissionColorMutationUpdateArgs> {
  // State
  private _hasBeenApplied: boolean = false;

  // Undo state
  private dataEmissionColor: Color3 | undefined = undefined;
  private sceneEmissionColor: Color3Babylon | undefined = undefined;

  public begin({ MaterialEditorViewController }: MaterialEditorViewMutationArguments): void {
    const { materialData, materialInstance } = MaterialEditorViewController;

    // - Store undo values
    this.dataEmissionColor = materialData.emissionColor;
    this.sceneEmissionColor = materialInstance.overridesFromMaterial.emissionColor;
  }

  public update({ MaterialEditorViewController }: MaterialEditorViewMutationArguments, { emissionColor }: SetMaterialEmissionColorMutationUpdateArgs): void {
    const { materialData, materialInstance } = MaterialEditorViewController;

    // - 1. Data
    materialData.emissionColor = emissionColor;
    // - 2. Babylon state
    materialInstance.overridesFromMaterial.emissionColor = toColor3Babylon(emissionColor);
  }

  public apply({ MaterialEditorViewController }: MaterialEditorViewMutationArguments): void {
    const { materialData } = MaterialEditorViewController;

    // 3. Update JSONC
    const jsonPath = resolvePath((materialDefinition: MaterialDefinition) => materialDefinition.emissionColor);
    if (materialData.emissionColor !== undefined) {
      MaterialEditorViewController.materialJson.mutate(jsonPath, toColor3Definition(materialData.emissionColor));
    } else {
      MaterialEditorViewController.materialJson.delete(jsonPath);
    }
  }

  public undo(_args: MaterialEditorViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `Set material emission color`;
  }

  public get hasBeenApplied(): boolean { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}
