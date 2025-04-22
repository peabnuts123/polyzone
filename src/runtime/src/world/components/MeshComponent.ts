import type { AssetContainer, InstantiatedEntries } from "@babylonjs/core/assetContainer";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";

import { MeshComponent as MeshComponentCore } from "@polyzone/core/src/world/components";
import { debug_modTexture } from "@polyzone/runtime/src";
import { RetroMaterial } from "@polyzone/runtime/src/materials/RetroMaterial";

import { GameObject } from "../GameObject";
import { Material } from "@babylonjs/core/Materials/material";

/**
 * Loads a mesh for this GameObject
 */
export class MeshComponent extends MeshComponentCore {
  public readonly id: string;
  public readonly gameObject: GameObject;

  /** Instances (clones) of model assets in the scene */
  protected readonly sceneInstances: InstantiatedEntries;

  /**
   * @param data Data needed to construct a GameObjectComponent.
   * @param asset Model assets loaded by Babylon
   */
  public constructor(id: string, gameObject: GameObject, asset: AssetContainer) {
    super();
    this.id = id;
    this.gameObject = gameObject;

    for (const texture of asset.textures) {
      debug_modTexture(texture);
    }


    for (let i = 0; i < asset.materials.length; i++) {
      const oldMaterial = asset.materials[i];

      let newMaterial: RetroMaterial | undefined;
      if (oldMaterial instanceof StandardMaterial) {
        // @TODO material editor Tool
        newMaterial = new RetroMaterial(oldMaterial.name, asset.scene);
        newMaterial.diffuseTexture = oldMaterial.diffuseTexture;

        newMaterial.transparencyMode = oldMaterial.opacityTexture ? Material.MATERIAL_ALPHABLEND : Material.MATERIAL_OPAQUE;
      } else if (oldMaterial instanceof PBRMaterial) {
        console.error(`Unimplemented material type: `, oldMaterial);
      } else {
        console.error(`Unimplemented material type: `, oldMaterial);
      }

      if (newMaterial !== undefined) {
        // Replace material with master retro material
        asset.scene.removeMaterial(oldMaterial);
        asset.scene.addMaterial(newMaterial);

        // Find any meshes referencing the old material and replace them
        for (const mesh of asset.meshes) {
          if (mesh.material?.name === oldMaterial.name) {
            mesh.material = newMaterial;
          }
        }

        // 🤷‍♀️
        asset.materials[i] = newMaterial;
        oldMaterial.dispose();
      }
    }

    this.sceneInstances = asset.instantiateModelsToScene();
    this.sceneInstances.rootNodes.forEach((node) => {
      node.parent = this.gameObject.transform.node;
    });
  }

  public override onDestroy(): void {
    this.sceneInstances.dispose();
  }
}
