import { runInAction } from 'mobx';
import { v4 as uuid } from 'uuid';

import { ComponentDefinitionType } from '@polyzone/runtime/src/cartridge';

import { JsoncContainer, resolvePath } from '@lib/util/JsoncContainer';
import { ProjectDefinition, SceneManifest } from '@lib/project/definition';
import { SceneDefinition } from '@lib/project/definition/scene/SceneDefinition';
import { invoke } from '@lib/util/TauriCommands';
import { IProjectMutation } from "../IProjectMutation";
import { ProjectMutationArguments } from "../ProjectMutationArguments";

export class CreateNewSceneMutation implements IProjectMutation {
  private path: string;

  public constructor(path: string) {
    this.path = path;
  }

  public async apply({ ProjectController }: ProjectMutationArguments): Promise<void> {
    // New Data
    const newSceneJsonc = this.createNewSceneDefinition();
    const newSceneJsoncBytes = new TextEncoder().encode(
      newSceneJsonc.toString(),
    );
    // Calculate new scene's hash (async)
    const newSceneHash = await invoke('hash_data', {
      data: Array.from(newSceneJsoncBytes),
    });
    const newSceneManifest: SceneManifest = {
      id: uuid(),
      hash: newSceneHash,
      path: this.path,
    };

    // 1. Update data
    runInAction(() => {
      ProjectController.project.scenes.add(newSceneManifest, newSceneJsonc);
    });

    // 2. Update JSON
    const jsonPath = resolvePath((project: ProjectDefinition) => project.scenes[ProjectController.projectDefinition.scenes.length]);
    ProjectController.projectJson.mutate(jsonPath, newSceneManifest, { isArrayInsertion: true });

    // 3. Create new asset on disk
    await ProjectController.fileSystem.writeFile(
      this.path,
      newSceneJsoncBytes,
    );
  }

  undo(_args: ProjectMutationArguments): void {
    // @TODO prompt for undo?
    throw new Error("Method not implemented.");
  }

  private createNewSceneDefinition(): JsoncContainer<SceneDefinition> {
    const definition: SceneDefinition = {
      config: {
        clearColor: {
          r: 255,
          g: 235,
          b: 245,
        },
        lighting: {
          ambient: {
            color: {
              r: 255,
              g: 255,
              b: 255,
            },
            intensity: 0.3,
          },
        },
      },
      objects: [
        {
          id: uuid(),
          name: 'Main camera',
          transform: {
            position: { x: 0, y: 0, z: -5 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
          children: [],
          components: [
            {
              id: uuid(),
              type: ComponentDefinitionType.Camera,
            },
          ],
        },
        {
          id: uuid(),
          name: 'Sun',
          transform: {
            position: { x: 0, y: 10, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
          children: [],
          components: [
            {
              id: uuid(),
              type: ComponentDefinitionType.DirectionalLight,
              color: {
                r: 255,
                g: 255,
                b: 255,
              },
              intensity: 1,
            },
          ],
        },
      ],
    };

    return new JsoncContainer(JSON.stringify(definition, null, 2));
  }

  get description(): string {
    return `Create new scene`;
  }
}

