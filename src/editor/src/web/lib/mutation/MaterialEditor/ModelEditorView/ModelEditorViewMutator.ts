import { ProjectController } from "@lib/project/ProjectController";
import { ModelEditorViewController } from "@lib/material-editor/model/ModelEditorViewController";
import { invoke } from "@lib/util/TauriCommands";
import { Mutator } from "../../Mutator";
import { ModelEditorViewMutationArguments } from "./ModelEditorViewMutationArguments";


export class ModelEditorViewMutator extends Mutator<ModelEditorViewMutationArguments> {
  private readonly modelEditorViewController: ModelEditorViewController;
  private readonly projectController: ProjectController;

  public constructor(modelEditorViewController: ModelEditorViewController, projectController: ProjectController) {
    super();
    this.modelEditorViewController = modelEditorViewController;
    this.projectController = projectController;
  }

  protected override getMutationArgs(): ModelEditorViewMutationArguments {
    return {
      ModelEditorViewController: this.modelEditorViewController,
      ProjectController: this.projectController,
    };
  }

  protected override async persistChanges(): Promise<void> {
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
  }
}
