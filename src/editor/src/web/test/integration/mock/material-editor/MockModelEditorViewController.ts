
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene as BabylonScene } from "@babylonjs/core/scene";

import { MeshAsset } from "@polyzone/runtime/src/world";
import { RetroMaterial } from "@polyzone/runtime/src/materials/RetroMaterial";

import { Func } from "@lib/util/types";
import { MeshAssetData } from "@lib/project/data";
import { MutationController } from "@lib/mutation/MutationController";
import { IModelEditorViewController } from "@lib/material-editor/model/ModelEditorViewController";

import { MockProjectController } from "../project/MockProjectController";
import { MockModelEditorViewMutator, MockModelEditorViewMutatorNew } from "./MockModelEditorViewMutator";

export class MockModelEditorViewController implements IModelEditorViewController {
  public canvas: HTMLCanvasElement;
  public model: MeshAssetData;
  public mutationController: MutationController;
  public mutator: MockModelEditorViewMutator;
  public mutatorNew: MockModelEditorViewMutatorNew;
  public meshAsset: MeshAsset;
  public selectedMaterialName: string | undefined = undefined;
  public scene: BabylonScene;

  public constructor(
    canvas: HTMLCanvasElement,
    model: MeshAssetData,
    meshAsset: MeshAsset,
    scene: BabylonScene,
    projectController: MockProjectController,
  ) {
    this.canvas = canvas;
    this.model = model;
    this.meshAsset = meshAsset;
    this.scene = scene;
    this.mutationController = new MutationController();
    this.mutator = new MockModelEditorViewMutator(this, projectController);
    this.mutatorNew = new MockModelEditorViewMutatorNew(this, projectController, this.mutationController);
  }

  public static async create(projectController: MockProjectController, meshAssetData: MeshAssetData): Promise<MockModelEditorViewController> {
    const canvas = document.createElement('canvas');
    const babylonEngine = new Engine(canvas);
    const scene = new BabylonScene(babylonEngine);

    const meshAsset = await projectController.assetCache.loadAsset(meshAssetData, scene);

    return new MockModelEditorViewController(
      canvas,
      meshAssetData,
      meshAsset,
      scene,
      projectController,
    );
  }

  startBabylonView: Func<Func<void>> = () => {
    return () => { };
  };
  destroy: Func<void> = () => {
    /* No-op */
  };
  reloadSceneData: (model?: MeshAssetData) => Promise<void> = () => {
    return Promise.resolve();
  };
  getMaterialByName: (materialName: string) => RetroMaterial = (materialName: string) => {
    const material = this.allMaterials.find((material) => material.name === materialName);
    if (!material) {
      throw new Error(`Cannot get material, no material exists on MockModelEditorViewController with name '${materialName}'`);
    }
    return material;
  };
  selectMaterial: (materialName: string) => void = (materialName) => {
    this.selectedMaterialName = materialName;
  };

  public get allMaterials(): RetroMaterial[] {
    return this.meshAsset.assetContainer.materials.map((material) => material as RetroMaterial);
  }
}
