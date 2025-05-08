
import { toColor3Babylon, toColor3Core, toColor3Definition } from "@polyzone/runtime/src/util";
import { RetroMaterial } from "@polyzone/runtime/src/materials/RetroMaterial";
import { MaterialDefinition } from "@polyzone/runtime/src/world";
import { resolvePath } from "@lib/util/JsoncContainer";
import { IMaterialEditorViewMutation } from "../IMaterialEditorViewMutation";
import { MaterialEditorViewMutationArguments } from "../MaterialEditorViewMutationArguments";

export class SetMaterialDiffuseColorEnabledMutation implements IMaterialEditorViewMutation {
  // Mutation parameters
  private readonly diffuseColorEnabled: boolean;

  // Undo state
  private oldDiffuseColorEnabled: boolean | undefined;

  public constructor(diffuseColorEnabled: boolean) {
    this.diffuseColorEnabled = diffuseColorEnabled;
  }

  public apply({ MaterialEditorViewController }: MaterialEditorViewMutationArguments): void {
    const { materialData, materialInstance } = MaterialEditorViewController;

    // 0. Store undo data
    this.oldDiffuseColorEnabled = materialData.diffuseColorEnabled;

    // 1. Update data
    materialData.diffuseColorEnabled = this.diffuseColorEnabled;
    if (this.diffuseColorEnabled) {
      // Also ensure color override is set if we're enabling it
      materialData.diffuseColor ??= toColor3Core(RetroMaterial.Defaults.diffuseColor);
    }

    // 2. Update Babylon state
    if (materialData.diffuseColor) {
      // Enabling override
      // Since we made sure the override had a color if it was enabled,
      // we know that there MUST be a value in the overrides data at this point
      materialInstance.overridesFromMaterial.diffuseColor = toColor3Babylon(materialData.diffuseColor);
    } else {
      // Disabling override - remove color from material
      materialInstance.overridesFromMaterial.diffuseColor = undefined;
    }

    // 3. Update JSONC
    const jsonPath = resolvePath((materialDefinition: MaterialDefinition) => materialDefinition.diffuseColor);
    if (materialData.diffuseColor) {
      MaterialEditorViewController.materialJson.mutate(jsonPath, toColor3Definition(materialData.diffuseColor));
    }
    else {
      MaterialEditorViewController.materialJson.delete(jsonPath);
    }
  }

  public undo(_args: MaterialEditorViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `${this.diffuseColorEnabled ? "Enable" : "Disable"} material diffuse color`;
  }
}
