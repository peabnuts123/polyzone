import { ProjectController } from "@lib/project/ProjectController";
import { ModelMaterialEditorController } from "@lib/material-editor/model/ModelMaterialEditorController";
import { invoke } from "@lib/util/TauriCommands";
import { Mutator } from "../Mutator";
import { ModelMaterialMutationArguments } from "./ModelMaterialMutationArguments";


export class ModelMaterialMutator extends Mutator<ModelMaterialMutationArguments> {
  private readonly modelMaterialEditorController: ModelMaterialEditorController;
  private readonly projectController: ProjectController;

  public constructor(modelMaterialEditorController: ModelMaterialEditorController, projectController: ProjectController) {
    super();
    this.modelMaterialEditorController = modelMaterialEditorController;
    this.projectController = projectController;
  }

  protected override getMutationArgs(): ModelMaterialMutationArguments {
    return {
      ModelMaterialEditorController: this.modelMaterialEditorController,
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
