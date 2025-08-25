import type { IProjectController } from "@lib/project/ProjectController";
import type { IMaterialEditorViewController } from "@lib/material-editor/material/MaterialEditorViewController";
import { invoke } from "@lib/util/TauriCommands";
import { MutatorNew } from "@lib/mutation/MutatorNew";
import { Mutator } from "../../Mutator";
import { MaterialEditorViewMutationArguments } from "./MaterialEditorViewMutationArguments";


export class MaterialEditorViewMutator extends Mutator<MaterialEditorViewMutationArguments> {
  private readonly materialEditorViewController: IMaterialEditorViewController;
  private readonly projectController: IProjectController;

  public constructor(materialEditorViewController: IMaterialEditorViewController, projectController: IProjectController) {
    super();
    this.materialEditorViewController = materialEditorViewController;
    this.projectController = projectController;

  }

  protected override getMutationArgs(): MaterialEditorViewMutationArguments {
    return {
      MaterialEditorViewController: this.materialEditorViewController,
      ProjectController: this.projectController,
    };
  }

  protected override async persistChanges(): Promise<void> {
    const { materialAssetData, materialJson } = this.materialEditorViewController;
    const { project, projectJson, projectDefinition, mutator: projectMutator } = this.projectController;

    const assetFileJson = materialJson.toString();
    const assetFileBytes = new TextEncoder().encode(assetFileJson);

    const existingAsset = project.assets.findById(materialAssetData.id);
    if (existingAsset === undefined) throw new Error(`Cannot persist changes to asset - it is not known to the project definition?`);

    const newAssetHash = await invoke('hash_data', { data: Array.from(assetFileBytes) });

    if (existingAsset.hash !== newAssetHash) {
      // Asset contents have changed - record changes to hash
      existingAsset.hash = newAssetHash;

      // Hash must change in project file too
      const assetDefinitionIndex = projectDefinition.assets.findIndex((assetDefinition) => assetDefinition.id === existingAsset.id);
      projectJson.mutate((project) => project.assets[assetDefinitionIndex].hash, newAssetHash);
      await projectMutator.persistChanges();
    }

    return this.projectController.fileSystem.writeFile(
      materialAssetData.path,
      assetFileBytes,
    );
  }
}

export class MaterialEditorViewMutatorNew extends MutatorNew<MaterialEditorViewMutationArguments> {
  private readonly materialEditorViewController: IMaterialEditorViewController;
  private readonly projectController: IProjectController;

  public constructor(materialEditorViewController: IMaterialEditorViewController, projectController: IProjectController) {
    super();
    this.materialEditorViewController = materialEditorViewController;
    this.projectController = projectController;

  }

  protected override getMutationArgs(): MaterialEditorViewMutationArguments {
    return {
      MaterialEditorViewController: this.materialEditorViewController,
      ProjectController: this.projectController,
    };
  }

  protected override async persistChanges(): Promise<void> {
    const { materialAssetData, materialJson } = this.materialEditorViewController;
    const { project, projectJson, projectDefinition, mutator: projectMutator } = this.projectController;

    const assetFileJson = materialJson.toString();
    const assetFileBytes = new TextEncoder().encode(assetFileJson);

    const existingAsset = project.assets.findById(materialAssetData.id);
    if (existingAsset === undefined) throw new Error(`Cannot persist changes to asset - it is not known to the project definition?`);

    const newAssetHash = await invoke('hash_data', { data: Array.from(assetFileBytes) });

    if (existingAsset.hash !== newAssetHash) {
      // Asset contents have changed - record changes to hash
      existingAsset.hash = newAssetHash;

      // Hash must change in project file too
      const assetDefinitionIndex = projectDefinition.assets.findIndex((assetDefinition) => assetDefinition.id === existingAsset.id);
      projectJson.mutate((project) => project.assets[assetDefinitionIndex].hash, newAssetHash);
      await projectMutator.persistChanges();
    }

    return this.projectController.fileSystem.writeFile(
      materialAssetData.path,
      assetFileBytes,
    );
  }
}
