import { v4 as uuid } from 'uuid';

import { AssetType } from '@polyzone/runtime/src/cartridge';

import { AssetDefinitionOfType, ProjectDefinition, ProjectManifest, SceneDefinition, SceneManifest } from "@lib/project";
import { JsoncContainer } from '@lib/util/JsoncContainer';

import { randomHash } from '@test/util';
import { createMockScene } from '@test/integration/mock/scene/createMockScene';
import { MockFile, MockFileSystem } from "@test/integration/mock/filesystem/MockFileSystem";


export interface MockProjectTools {
  manifest(manifest?: Partial<ProjectManifest>): ProjectManifest;
  asset<TAssetType extends AssetType>(type: TAssetType, path: string, data: Uint8Array, config?: Partial<AssetDefinitionOfType<TAssetType>>): AssetDefinitionOfType<TAssetType>;
  scene(...args: Parameters<typeof createMockScene>): SceneManifest;
}

export class MockProject {
  public readonly fileSystem: MockFileSystem;
  public readonly assetFiles: MockFile[];
  public readonly sceneFiles: MockFile[];
  public readonly projectFile: MockFile;

  public constructor(ctor: (tools: MockProjectTools) => ProjectDefinition) {
    const assetFiles: MockFile[] = this.assetFiles = [];
    const sceneFiles: MockFile[] = this.sceneFiles = [];

    const projectDefinition = ctor({
      manifest(partialManifest?: Partial<ProjectManifest>): ProjectManifest {
        return {
          projectName: "Mock Project",
          ...partialManifest,
        };
      },
      asset<TAssetType extends AssetType>(type: TAssetType, path: string, data: Uint8Array, config?: Partial<AssetDefinitionOfType<TAssetType>>): AssetDefinitionOfType<TAssetType> {
        const assetDefinition: AssetDefinitionOfType<TAssetType> = {
          id: uuid(),
          type,
          hash: randomHash(),
          path,
          ...config,
        } as AssetDefinitionOfType<TAssetType>;
        assetFiles.push({
          path,
          data,
        });
        return assetDefinition;
      },
      scene(...args: Parameters<typeof createMockScene>): SceneManifest {
        const scene = createMockScene(...args);
        sceneFiles.push({
          path: scene.manifest.path,
          data: new TextEncoder().encode(JSON.stringify(scene.definition)),
        });
        return scene.manifest;
      },
    });

    this.projectFile = {
      path: 'sample.pzproj',
      data: new TextEncoder().encode(JSON.stringify(projectDefinition)),
    };

    this.fileSystem = new MockFileSystem([
      ...this.assetFiles,
      ...this.sceneFiles,
      this.projectFile,
    ]);
  }

  public get project(): { path: string, definition: ProjectDefinition, jsonc: JsoncContainer<ProjectDefinition> } {
    const projectFile = this.fileSystem.readFileSync(this.projectFile.path);
    const jsonc = new JsoncContainer<ProjectDefinition>(projectFile.textContent);
    return {
      path: this.projectFile.path,
      definition: jsonc.value,
      jsonc,
    };
  }

  public get scenes(): { path: string, definition: SceneDefinition, jsonc: JsoncContainer<SceneDefinition> }[] {
    return this.sceneFiles.map(sceneMockFile => {
      const sceneFile = this.fileSystem.readFileSync(sceneMockFile.path);
      const jsonc = new JsoncContainer<SceneDefinition>(sceneFile.textContent);
      return {
        path: sceneMockFile.path,
        definition: jsonc.value,
        jsonc,
      };
    });
  }
}

