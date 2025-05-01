
import type { IComponentData } from './components';
import { ITransformData } from './TransformData';

export interface IGameObjectData {
  get id(): string;
  get name(): string;
  get transform(): ITransformData;
  get components(): IComponentData[];
  get children(): GameObjectData[];
}

/**
 * Data for a GameObject i.e. a GameObject loaded from the raw cartridge file
 * but not yet loaded into the game.
 */
export class GameObjectData implements IGameObjectData {
  public readonly id: string;
  public name: string;
  public transform: ITransformData;
  public components: IComponentData[];
  public children: IGameObjectData[];

  public constructor(id: string, name: string, transform: ITransformData, components: IComponentData[], children: IGameObjectData[]) {
    this.id = id;
    this.name = name;
    this.transform = transform;
    this.components = components;
    this.children = children;
  }
}
