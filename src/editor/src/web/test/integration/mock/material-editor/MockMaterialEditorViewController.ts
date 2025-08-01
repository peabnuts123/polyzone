import { Scene as BabylonScene } from '@babylonjs/core/scene';
import { Engine } from '@babylonjs/core/Engines/engine';

import { MaterialDefinition } from '@polyzone/runtime/src/world/assets';
import { RetroMaterial } from '@polyzone/runtime/src/materials/RetroMaterial';
import { AssetType } from '@polyzone/runtime/src/cartridge/archive/assets';

import { IMaterialEditorViewController } from '@lib/material-editor/material/MaterialEditorViewController';
import { JsoncContainer } from '@lib/util/JsoncContainer';
import { MaterialAssetData } from '@lib/project/data';
import { MaterialData } from '@lib/material-editor/material/MaterialData';
import type { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MaterialAssetDefinition } from '@lib/project';

import { MockMaterialEditorViewMutator } from './MockMaterialEditorViewMutator';

/**
 * Mock version of `MaterialEditorViewController` that just houses state, and otherwise contains no logic.
 */
export class MockMaterialEditorViewController implements IMaterialEditorViewController {
  public canvas: HTMLCanvasElement;
  public hasLoadedMaterial: boolean = true;
  public materialAssetData: MaterialAssetData;
  public materialData: MaterialData;
  public materialJson: JsoncContainer<MaterialDefinition>;
  public materialInstance: RetroMaterial;
  public mutator: MockMaterialEditorViewMutator;
  public scene: BabylonScene;

  private constructor(
    canvas: HTMLCanvasElement,
    materialAssetData: MaterialAssetData,
    materialData: MaterialData,
    materialJson: JsoncContainer<MaterialDefinition>,
    materialInstance: RetroMaterial,
    scene: BabylonScene,
    projectController: MockProjectController,
  ) {
    this.canvas = canvas;
    this.materialAssetData = materialAssetData;
    this.materialData = materialData;
    this.materialJson = materialJson;
    this.materialInstance = materialInstance;
    this.scene = scene;
    this.mutator = new MockMaterialEditorViewMutator(this, projectController);
  }

  public static async create(
    projectController: MockProjectController,
    mockMaterialAssetDefinition: MaterialAssetDefinition,
    mockMaterialDefinition: MaterialDefinition,
  ): Promise<MockMaterialEditorViewController> {
    const canvas = document.createElement('canvas');
    const babylonEngine = new Engine(canvas);
    const scene = new BabylonScene(babylonEngine);

    /*
      @NOTE Sorry, the asset pipeline is a bit confusing for assets like Materials which are JSON files.
      It is easy to confuse the asset definition with the asset itself.
      What makes things more confusing is that the order things are loaded in the tests doesn't match the normal application
      since we generally want to GIVE the application some test data, instead of loading it from disk.

      MaterialAssetDefinition       - Definition of an asset (type: material) from project file
      MaterialAssetData             - Material asset loaded into application (the definition, not the asset itself)

      The material asset POINTS to the actual material file

      MaterialDefinition            - The contents of an actual material file (raw contents)
      MaterialData                  - Contents of material file loaded into application (the actual material asset)

      The material data can then be loaded fully including all textures, ready for Babylon

      MaterialAsset                 - A fully loaded Material file, including references to all asset dependencies (also loaded)
    */

    // Get material asset data from project controller
    const materialAssetData = projectController.project.assets.getById(mockMaterialAssetDefinition.id, AssetType.Material);

    // Load material asset from asset data
    const materialAsset = await projectController.assetCache.loadAsset(materialAssetData, scene);

    // Load material definition separately (for mocking the controller)
    const materialJson = new JsoncContainer<MaterialDefinition>(JSON.stringify(mockMaterialDefinition));
    const materialData = MaterialData.fromDefinition(mockMaterialDefinition, projectController.project.assets);

    // Create Babylon material and read overrides from material asset
    const materialInstance = new RetroMaterial('preview', scene);
    materialInstance.readOverridesFromMaterial(materialAsset);

    return new MockMaterialEditorViewController(
      canvas,
      materialAssetData,
      materialData,
      materialJson,
      materialInstance,
      scene,
      projectController,
    );
  }

  startBabylonView(): () => void {
    throw new Error("Method not implemented.");
  }
  destroy(): void {
    throw new Error("Method not implemented.");
  }
  reloadSceneData(_material?: MaterialAssetData): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
