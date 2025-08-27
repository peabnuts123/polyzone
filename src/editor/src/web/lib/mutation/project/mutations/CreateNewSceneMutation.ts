import { runInAction } from 'mobx';
import { v4 as uuid } from 'uuid';

import { ComponentDefinitionType } from '@polyzone/runtime/src/cartridge';

import { JsoncContainer, resolvePath } from '@lib/util/JsoncContainer';
import { ProjectDefinition, SceneManifest } from '@lib/project/definition';
import { SceneDefinition } from '@lib/project/definition/scene/SceneDefinition';
import { invoke } from '@lib/util/TauriCommands';
import { BaseProjectMutation } from "../IProjectMutation";
import { ProjectMutationArguments } from "../ProjectMutationArguments";

interface MutationArgs {
  path: string;
}

export class CreateNewSceneMutation extends BaseProjectMutation<MutationArgs> {
  public override promptForUndo: boolean = true;
  protected override useCustomUndo: boolean = true;

  public constructor(path: string) {
    super({ path });
  }

  public async apply({ ProjectController }: ProjectMutationArguments, { path }: MutationArgs): Promise<void> {
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
      path,
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
      path,
      newSceneJsoncBytes,
    );
  }

  public override async customUndo({ ProjectController }: ProjectMutationArguments, { path }: MutationArgs): Promise<void> {
    const newScene = ProjectController.project.scenes.getByPath(path);
    if (newScene === undefined) {
      throw new Error(`Cannot undo CreateNewSceneMutation - scene not found at path: ${path}`);
    }

    // 1. Update data
    ProjectController.project.scenes.remove(newScene.data.id);

    // 2. Update JSON
    const sceneIndex = ProjectController.projectJson.value.scenes.findIndex((scene) => scene.id === newScene.data.id);
    const jsonPath = resolvePath((project: ProjectDefinition) => project.scenes[sceneIndex]);
    ProjectController.projectJson.delete(jsonPath);

    // 3. Delete asset from disk
    // @TODO pop up some kind of confirmation
    await ProjectController.fileSystem.deleteFile(path);
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

