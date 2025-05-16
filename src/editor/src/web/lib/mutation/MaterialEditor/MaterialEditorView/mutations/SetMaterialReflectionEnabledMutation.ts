import { MaterialAsset, MaterialDefinition, ReflectionLoading } from "@polyzone/runtime/src/world";
import { IMaterialEditorViewMutation } from "../IMaterialEditorViewMutation";
import { MaterialEditorViewMutationArguments } from "../MaterialEditorViewMutationArguments";
import { resolvePath } from "@lib/util/JsoncContainer";
import { reflectionDataToDefinition } from "@lib/project/data";

export class SetMaterialReflectionEnabledMutation implements IMaterialEditorViewMutation {
  // Mutation parameters
  private readonly reflectionEnabled: boolean;

  // Undo state
  private oldReflectionEnabled: boolean | undefined;

  public constructor(reflectionEnabled: boolean) {
    this.reflectionEnabled = reflectionEnabled;
  }

  public apply({ ProjectController, MaterialEditorViewController }: MaterialEditorViewMutationArguments): void {
    const { materialData, materialInstance } = MaterialEditorViewController;

    // 0. Store undo data
    this.oldReflectionEnabled = materialData.reflectionEnabled;

    // 1. Update data
    materialData.reflectionEnabled = this.reflectionEnabled;

    // 2. Update Babylon state
    if (materialData.reflection !== undefined) {
      // Enabling override
      // Set the material's reflection texture IF one is fully defined in the override data
      ReflectionLoading.load(materialData.reflection, ProjectController.assetCache, MaterialEditorViewController.scene)
        .then((reflection) => {
          materialInstance.overridesFromMaterial.reflectionTexture = reflection?.texture;
        });
    } else {
      // Disabling override
      materialInstance.overridesFromMaterial.reflectionTexture = undefined;
    }

    // 3. Update JSONC
    const jsonPath = resolvePath((materialDefinition: MaterialDefinition) => materialDefinition.reflection);
    if (materialData.reflection !== undefined) {
      const reflectionDefinition = reflectionDataToDefinition(materialData.reflection);
      MaterialEditorViewController.materialJson.mutate(jsonPath, reflectionDefinition);
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
    return `${this.reflectionEnabled ? "Enable" : "Disable"} material reflection`;
  }
}
