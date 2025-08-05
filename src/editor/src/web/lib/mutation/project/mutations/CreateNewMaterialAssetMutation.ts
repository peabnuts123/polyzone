import { runInAction } from 'mobx';
import { v4 as uuid } from 'uuid';

import { AssetType } from '@polyzone/runtime/src/cartridge';

import { JsoncContainer, resolvePath } from '@lib/util/JsoncContainer';
import { MaterialAssetDefinition, ProjectDefinition } from '@lib/project/definition';
import { invoke } from '@lib/util/TauriCommands';
import { IProjectMutation } from "../IProjectMutation";
import { ProjectMutationArguments } from "../ProjectMutationArguments";
import { MaterialDefinition } from '@polyzone/runtime/src/world';
import { MaterialAssetData } from '@lib/project/data';

export class CreateNewMaterialAssetMutation implements IProjectMutation {
  private path: string;

  public constructor(path: string) {
    this.path = path;
  }

  public async apply({ ProjectController }: ProjectMutationArguments): Promise<void> {
    // New Data

    const newMaterialAssetDefinition: MaterialDefinition = {};
    const newMaterialJsonc = new JsoncContainer(JSON.stringify(newMaterialAssetDefinition, null, 2));
    const newMaterialJsoncBytes = new TextEncoder().encode(
      newMaterialJsonc.toString(),
    );
    // Calculate new asset's hash (async)
    const newAssetHash = await invoke('hash_data', {
      data: Array.from(newMaterialJsoncBytes),
    });
    const newAssetDefinition: MaterialAssetDefinition = {
      id: uuid(),
      type: AssetType.Material,
      hash: newAssetHash,
      path: this.path,
    };

    // 1. Update data
    runInAction(() => {
      ProjectController.project.assets.add(new MaterialAssetData({
        id: newAssetDefinition.id,
        hash: newAssetDefinition.hash,
        path: newAssetDefinition.path,
        resolverProtocol: ProjectController.project.assets.fileSystem.resolverProtocol,
      }));
    });

    // 2. Update JSON
    const jsonPath = resolvePath((project: ProjectDefinition) => project.assets[ProjectController.projectDefinition.assets.length]);
    ProjectController.projectJson.mutate(jsonPath, newAssetDefinition, { isArrayInsertion: true });

    // 3. Create new asset on disk
    await ProjectController.fileSystem.writeFile(
      this.path,
      newMaterialJsoncBytes,
    );
  }

  undo(_args: ProjectMutationArguments): void {
    // @TODO prompt for undo?
    throw new Error("Method not implemented.");
  }


  get description(): string {
    return `Create new material asset`;
  }
}

