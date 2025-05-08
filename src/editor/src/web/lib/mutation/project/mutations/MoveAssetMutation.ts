import { resolvePath } from '@lib/util/JsoncContainer';
import { ProjectDefinition } from '@lib/project/definition';
import { IProjectMutation } from "../IProjectMutation";
import { ProjectMutationArguments } from "../ProjectMutationArguments";

export class MoveAssetMutation implements IProjectMutation {
  private readonly assetId: string;
  private newPath: string;

  public constructor(assetId: string, newPath: string) {
    if (newPath.trim() === '') {
      throw new Error(`Cannot move asset - 'path' cannot be empty`);
    }

    this.assetId = assetId;
    this.newPath = newPath;
  }

  apply({ ProjectController }: ProjectMutationArguments): void {
    const assetData = ProjectController.project.assets.findById(this.assetId);
    if (assetData === undefined) throw new Error(`Cannot move asset - No asset exists with Id '${this.assetId}'`);
    const oldPath = assetData.path;

    // 1. Update data
    assetData.path = this.newPath;

    // 2. Update JSON
    const jsonIndex = ProjectController.projectDefinition.assets.findIndex((assetDefinition) => assetDefinition.id === assetData.id);
    const jsonPath = resolvePath((project: ProjectDefinition) => project.assets[jsonIndex].path);
    ProjectController.projectJson.mutate(jsonPath, this.newPath);

    // 3. Move asset on disk
    void ProjectController.fileSystem.moveFile(
      oldPath,
      this.newPath,
    );
  }

  undo(_args: ProjectMutationArguments): void {
    // @TODO prompt for undo?
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Rename asset`;
  }
}

