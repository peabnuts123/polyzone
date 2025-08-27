import type { IProjectController } from "@lib/project/ProjectController";
import { invoke } from "@lib/util/TauriCommands";
import { Mutator } from "../Mutator";
import { ProjectMutationArguments } from "./ProjectMutationArguments";
import { MutatorNew } from "../MutatorNew";
import { MutationController } from "../MutationController";

export class ProjectMutator extends Mutator<ProjectMutationArguments> {
  private readonly projectController: IProjectController;

  public constructor(projectController: IProjectController) {
    super();
    this.projectController = projectController;
  }

  protected override getMutationArgs(): ProjectMutationArguments {
    return {
      ProjectController: this.projectController,
    };
  }

  public override async persistChanges(): Promise<void> {
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
export class ProjectMutatorNew extends MutatorNew<ProjectMutationArguments> {
  private readonly projectController: IProjectController;

  public constructor(projectController: IProjectController, mutationController: MutationController) {
    super(mutationController);
    this.projectController = projectController;
  }

  protected override getMutationArgs(): ProjectMutationArguments {
    return {
      ProjectController: this.projectController,
    };
  }

  public override async persistChanges(): Promise<void> {
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
