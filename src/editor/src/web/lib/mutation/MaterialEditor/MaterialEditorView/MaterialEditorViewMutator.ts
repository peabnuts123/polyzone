import { ProjectController } from "@lib/project/ProjectController";
import { MaterialEditorViewController } from "@lib/material-editor/material/MaterialEditorViewController";
import { invoke } from "@lib/util/TauriCommands";
import { Mutator } from "../../Mutator";
import { MaterialEditorViewMutationArguments } from "./MaterialEditorViewMutationArguments";


export class MaterialEditorViewMutator extends Mutator<MaterialEditorViewMutationArguments> {
  private readonly materialEditorViewController: MaterialEditorViewController;
  private readonly projectController: ProjectController;

  public constructor(materialEditorViewController: MaterialEditorViewController, projectController: ProjectController) {
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
