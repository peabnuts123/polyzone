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
    /* Write any changes to the project file */
    const writeProjectFile = async (): Promise<void> => {
      const projectFileJson = this.projectController.projectJson.toString();
      const projectFileBytes = new TextEncoder().encode(projectFileJson);

      // Notify backend of modified project file to prevent a duplicate project modified event
      await invoke('notify_project_file_updated', {
        data: Array.from(projectFileBytes),
      });

      await this.projectController.fileSystem.writeFile(
        this.projectController.project.fileName,
        projectFileBytes,
      );
    };

    /* Write any changes to the asset file */
    const writeAssetFile = async (): Promise<void> => {
      const assetFileJson = this.materialEditorViewController.materialJson.toString();
      const assetFileBytes = new TextEncoder().encode(assetFileJson);

      await this.projectController.fileSystem.writeFile(
        this.materialEditorViewController.materialAssetData.path,
        assetFileBytes,
      );
    };

    await Promise.all([
      writeProjectFile(),
      writeAssetFile(),
    ]);
  }
}
