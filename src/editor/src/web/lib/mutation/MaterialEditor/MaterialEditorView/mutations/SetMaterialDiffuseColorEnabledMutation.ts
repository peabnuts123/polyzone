
import { toColor3Babylon, toColor3Core, toColor3Definition } from "@polyzone/runtime/src/util";
import { RetroMaterial } from "@polyzone/runtime/src/materials/RetroMaterial";
import { MaterialAsset, MaterialDefinition } from "@polyzone/runtime/src/world/assets";
import { resolvePath } from "@lib/util/JsoncContainer";
import { BaseMaterialEditorViewMutation } from "../IMaterialEditorViewMutation";
import { MaterialEditorViewMutationArguments } from "../MaterialEditorViewMutationArguments";

interface MutationArgs {
  diffuseColorEnabled: boolean;
}

export class SetMaterialDiffuseColorEnabledMutation extends BaseMaterialEditorViewMutation<MutationArgs> {
  public constructor(diffuseColorEnabled: boolean) {
    super({
      diffuseColorEnabled,
    });
  }

  public override apply({ MaterialEditorViewController }: MaterialEditorViewMutationArguments, { diffuseColorEnabled }: MutationArgs): void {
    const { materialData, materialInstance } = MaterialEditorViewController;

    // 1. Update data
    materialData.diffuseColorEnabled = diffuseColorEnabled;
    if (diffuseColorEnabled) {
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
    } else {
      MaterialEditorViewController.materialJson.delete(jsonPath);
    }
  }

  public override async afterPersistChanges({ ProjectController, MaterialEditorViewController }: MaterialEditorViewMutationArguments): Promise<void> {
    const { materialAssetData, materialData } = MaterialEditorViewController;

    // Update asset in cache
    ProjectController.assetCache.set(materialAssetData.id, (context) => {
      return MaterialAsset.fromMaterialData(materialData, materialAssetData, context);
    });

    // Ensure asset is loaded so that dependencies are up to date
    await ProjectController.assetCache.loadAsset(materialAssetData, MaterialEditorViewController.scene);
  }

  public override getUndoArgs({ MaterialEditorViewController }: MaterialEditorViewMutationArguments): MutationArgs {
    const { materialData } = MaterialEditorViewController;

    return {
      diffuseColorEnabled: materialData.diffuseColorEnabled,
    };
  }

  public get description(): string {
    return `${this.args.diffuseColorEnabled ? "Enable" : "Disable"} material diffuse color`;
  }
}
