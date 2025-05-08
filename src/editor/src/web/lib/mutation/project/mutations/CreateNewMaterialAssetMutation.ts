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

  apply({ ProjectController }: ProjectMutationArguments): void {
    // New Data
    const newAssetDefinition: MaterialAssetDefinition = {
      id: uuid(),
      type: AssetType.Material,
      hash: "", // @NOTE calculated asynchronously
      path: this.path,
    };
    const newMaterialAssetDefinition: MaterialDefinition = {};
    const newMaterialJsonc = new JsoncContainer(JSON.stringify(newMaterialAssetDefinition, null, 2));
    const newMaterialJsoncBytes = new TextEncoder().encode(
      newMaterialJsonc.toString(),
    );

    // 0. Calculate hash (asynchronously)
    // @NOTE We could just delete this whole block and rely on the FS watcher to
    // notify the frontend of the asset's hash. However, PolyZone has a principle that no
    // functionality within the app should rely on the FS watcher. So we manually
    // request the hash of the new asset and assign it, in case the FS watcher is not working.
    invoke('hash_data', {
      data: Array.from(newMaterialJsoncBytes),
    }).then((newAssetHash) => {
      // ???. (later) - Update references to hash
      const assetData = ProjectController.project.assets.getById(newAssetDefinition.id, AssetType.Material);
      if (assetData !== undefined) {
        assetData.hash = newAssetHash;
      }

      const assetIndex = ProjectController.projectDefinition.assets.findIndex((asset) => asset.id === newAssetDefinition.id);
      if (ProjectController.projectDefinition.assets[assetIndex].hash !== newAssetHash) {
        const jsonPath = resolvePath((project: ProjectDefinition) => project.assets[assetIndex].hash);
        ProjectController.projectJson.mutate(jsonPath, newAssetHash);
        // @NOTE re-invoke persistChanges() after editing project file a second time
        return ProjectController.mutator.persistChanges();
      }
    });

    // 1. Update data
    ProjectController.project.assets.add(new MaterialAssetData({
      id: newAssetDefinition.id,
      hash: newAssetDefinition.hash,
      path: newAssetDefinition.path,
      resolverProtocol: ProjectController.project.assets.fileSystem.resolverProtocol,
    }));

    // 2. Update JSON
    const jsonPath = resolvePath((project: ProjectDefinition) => project.assets[ProjectController.projectDefinition.assets.length]);
    ProjectController.projectJson.mutate(jsonPath, newAssetDefinition, { isArrayInsertion: true });

    // 3. Create new asset on disk
    void ProjectController.fileSystem.writeFile(
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

