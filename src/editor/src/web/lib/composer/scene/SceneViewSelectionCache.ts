import { ModelNode } from '@lopoly/engine/scene/nodes';
import { GameObjectId } from '@polyzone/core/objects/GameObject';

export class SceneViewSelectionCache {
  private cache: Map<ModelNode, GameObjectId>;

  public constructor() {
    this.cache = new Map();
  }

  public get(modelNode: ModelNode): GameObjectId | undefined {
    return this.cache.get(modelNode);
  }

  public add(gameObjectId: GameObjectId, modelNodes: ModelNode[]): void {
    for (const modelNode of modelNodes) {
      this.cache.set(modelNode, gameObjectId);
    }
  }

  public remove(modelNodes: ModelNode[]): void {
    for (const modelNode of modelNodes) {
      this.cache.delete(modelNode);
    }
  }

  public clear(): void {
    this.cache.clear();
  }
}
