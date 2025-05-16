import { RetroMaterial } from "@polyzone/runtime/src/materials/RetroMaterial";
import { MaterialAsset, MaterialDefinition } from "@polyzone/runtime/src/world";
import { toColor3Babylon, toColor3Core, toColor3Definition } from "@polyzone/runtime/src/util";
import { resolvePath } from "@lib/util/JsoncContainer";
import { IMaterialEditorViewMutation } from "../IMaterialEditorViewMutation";
import { MaterialEditorViewMutationArguments } from "../MaterialEditorViewMutationArguments";

export class SetMaterialEmissionColorEnabledMutation implements IMaterialEditorViewMutation {
  // Mutation parameters
  private readonly emissionColorEnabled: boolean;

  // Undo state
  private oldEmissionColorEnabled: boolean | undefined;

  public constructor(emissionColorEnabled: boolean) {
    this.emissionColorEnabled = emissionColorEnabled;
  }

  public apply({ MaterialEditorViewController }: MaterialEditorViewMutationArguments): void {
    const { materialData, materialInstance } = MaterialEditorViewController;

    // 0. Store undo data
    this.oldEmissionColorEnabled = materialData?.emissionColorEnabled;

    // 1. Update data
    materialData.emissionColorEnabled = this.emissionColorEnabled;
    if (this.emissionColorEnabled) {
      // Also ensure color override is set if we're enabling it
      materialData.emissionColor ??= toColor3Core(RetroMaterial.Defaults.emissiveColor);
    }

    // 2. Update Babylon state
    if (materialData.emissionColor) {
      // Enabling override
      // Since we made sure the override had a color if it was enabled,
      // we know that there MUST be a value in the overrides data at this point
      materialInstance.overridesFromMaterial.emissionColor = toColor3Babylon(materialData.emissionColor);
    } else {
      // Disabling override - remove color from material
      materialInstance.overridesFromMaterial.emissionColor = undefined;
    }

    // 3. Update JSONC
    const jsonPath = resolvePath((materialDefinition: MaterialDefinition) => materialDefinition.emissionColor);
    if (materialData.emissionColor) {
      MaterialEditorViewController.materialJson.mutate(jsonPath, toColor3Definition(materialData.emissionColor));
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
    return `${this.emissionColorEnabled ? "Enable" : "Disable"} material emission color`;
  }
}
