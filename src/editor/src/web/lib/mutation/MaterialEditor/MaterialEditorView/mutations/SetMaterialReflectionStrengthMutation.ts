import { IContinuousMaterialEditorViewMutation } from "../IContinuousMaterialEditorViewMutation";
import { IMaterialEditorViewMutation } from "../IMaterialEditorViewMutation";
import { MaterialEditorViewMutationArguments } from "../MaterialEditorViewMutationArguments";
import { resolvePath } from "@lib/util/JsoncContainer";
import { MaterialDefinition } from "@polyzone/runtime/src/world";

export interface SetMaterialReflectionStrengthMutationUpdateArgs {
  reflectionStrength: number;
}

export class SetMaterialReflectionStrengthMutation implements IMaterialEditorViewMutation, IContinuousMaterialEditorViewMutation<SetMaterialReflectionStrengthMutationUpdateArgs> {
  // State
  private _hasBeenApplied: boolean = false;

  // Undo state
  private oldReflectionStrength: number | undefined;

  public begin({ MaterialEditorViewController }: MaterialEditorViewMutationArguments): void {
    const { materialData } = MaterialEditorViewController;

    if (materialData.reflection?.type === undefined) {
      throw new Error(`Cannot set reflection texture for material - the material doesn't have the correct reflection type set`);
    }

    // 0. Store undo data
    this.oldReflectionStrength = materialData.reflection?.strength;
  }

  public update({ MaterialEditorViewController }: MaterialEditorViewMutationArguments, { reflectionStrength }: SetMaterialReflectionStrengthMutationUpdateArgs): void {
    const { materialData, materialInstance } = MaterialEditorViewController;

    if (materialData.reflection?.type === undefined) {
      throw new Error(`Cannot set reflection texture for material - the material doesn't have the correct reflection type set`);
    }

    // 1. Update data
    materialData.reflection.strength = reflectionStrength;

    // 2. Update Babylon state
    if (materialInstance.overridesFromMaterial.reflectionTexture) {
      materialInstance.overridesFromMaterial.reflectionTexture.level = reflectionStrength;
    }
  }

  public apply({ MaterialEditorViewController }: MaterialEditorViewMutationArguments): void {
    const { materialData } = MaterialEditorViewController;

    if (materialData.reflection?.type === undefined) {
      throw new Error(`Cannot set reflection texture for material - the material doesn't have the correct reflection type set`);
    }

    // 3. Update JSONC
    const jsonPath = resolvePath((materialDefinition: MaterialDefinition) => materialDefinition.reflection!.strength);
    // @NOTE Technically strength should never be undefined, but ¯\_(ツ)_/¯
    if (materialData.reflection.strength !== undefined) {
      MaterialEditorViewController.materialJson.mutate(jsonPath, materialData.reflection.strength);
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
    return `Set material reflection strength`;
  }

  public get hasBeenApplied(): boolean { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}
