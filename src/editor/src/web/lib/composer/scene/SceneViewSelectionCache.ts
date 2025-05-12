import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

export class SceneViewSelectionCache {
  private cache: Map<AbstractMesh, string>;

  public constructor() {
    this.cache = new Map();
  }

  public get(asset: AbstractMesh): string | undefined {
    return this.cache.get(asset);
  }

  public add(gameObjectId: string, assets: AbstractMesh[]): void {
    for (const asset of assets) {
      this.cache.set(asset, gameObjectId);
    }
  }

  public remove(assets: AbstractMesh[]): void {
    for (const asset of assets) {
      this.cache.delete(asset);
    }
  }

  public clear(): void {
    this.cache.clear();
  }
}
